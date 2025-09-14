import { Request, Response } from "express";
import {postgres} from '../config/postgres.js';
import Parser from 'node-sql-parser';
import {ALL_EVENTS, SITE_PERFORMANCE, SITE_RESOURCE_ANALYSIS} from '../config/athena.js';
import {s3Client,athenaClient, BUCKET_NAME, ListObjectsV2Command, GetObjectCommand,StartQueryExecutionCommand,
  GetQueryExecutionCommand,GetQueryResultsCommand,QueryExecutionState,ATHENA_DATABASE,ATHENA_OUTPUT_LOCATION,
  QUERY_TIMEOUT_MS,POLL_INTERVAL_MS} from '../config/aws.js';


export const eventData = async (req: Request, res: Response) => {
  console.log('eventData function called at:', new Date().toISOString());
  let client;
  try {
    console.log('Attempting database connection...');
    for (const [key,value] of Object.entries(process.memoryUsage())){
      console.log(`Memory usage by ${key}, ${value/1000000}MB `)
    }

    client = await postgres.connect();      
    const result = await client.query('SELECT * FROM "GuestUser"');
    console.log('Query successful! Found', result.rows.length, 'rows');
        
    const data = result.rows.map((row, index) => ({
      Id: row.Id,
      App: row.App,
      User: row.User__c,
      Image: row.Image_Type,
      Login: row.Login_Type,
      Date: new Date(row.Created_At).toLocaleString(),
    }));

    console.log('Sending response with', data.length, 'items');
    for (const [key,value] of Object.entries(process.memoryUsage())){
      console.log(`Memory usage by ${key}, ${value/1000000}MB `)
    }
    res.status(200).json({ message: data });
  } catch (err: any) {
    console.error('Unexpected error in eventData:', err);
    return res.status(500).json({ 
      error: 'Unexpected error',
      message: err.message 
    });
  } finally{
    if(client){
      client.release();
      console.log('Database client released');
    }
  }
};

const generateS3Prefixes = (startDate: Date, endDate: Date, key: string): string[] => {
  const prefixes: string[] = [];
  const current = startDate;
  const modifiedEndDate = endDate;
  modifiedEndDate.setHours(endDate.getHours() + 1);
  const folder = key === 'streaming' ? 'logs' : 'events';
  
  while (current <= modifiedEndDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const hour = String(current.getHours()).padStart(2, '0');
    
    const prefix = `${folder}/year=${year}/month=${month}/day=${day}/hour=${hour}/`;
    prefixes.push(prefix);
    
    current.setHours(current.getHours() + 1);
  }
  
  return prefixes;
};

export const kafkaData = async (req: Request, res: Response) => {
  for (const [key,value] of Object.entries(process.memoryUsage())){
      console.log(`Memory usage by ${key}, ${value/1000000}MB `)
  }
  try {
    if (req.query.key !== 'streaming' && req.query.key !== 'event') {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'Invalid Request'
      });
    }
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
    const startDate = new Date(defaultStartDate);
    const endDate = now;

    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before endDate'
      });
    }
    
    // Limit date range to prevent overwhelming queries (max 7 days)
    const maxRange = 7 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      return res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum date range is 7 days'
      });
    }
    
    console.log(`Fetching Kafka logs from S3 for range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const allLogs: any[] = [];
    let totalBatches = 0;
    let processedFiles = 0;
    let errorCount = 0;
    
    // Generate all possible S3 prefixes for the date range
    const prefixes = generateS3Prefixes(startDate, endDate, req.query.key);
    
    // Process each hour prefix
    for (const prefix of prefixes) {
      try {
        // List objects with this prefix
        const listParams = {
          Bucket: BUCKET_NAME,
          Prefix: prefix,
          MaxKeys: 1000 // Max files per hour
        };

        const objects = await s3Client.send(new ListObjectsV2Command(listParams));

        if (!objects.Contents || objects.Contents.length === 0) {
          console.log(`No objects found for prefix: ${prefix}`);
          continue;
        }
        
        console.log(`Found ${objects.Contents.length} files in prefix: ${prefix}`);
        
        // Fetch each Kafka batch file
        for (const object of objects.Contents) {
          try {           
            const getParams = {
              Bucket: BUCKET_NAME,
              Key: object.Key!
            };

            const data = await s3Client.send(new GetObjectCommand(getParams));

            if (!data.Body) {
              console.warn(`Empty file: ${object.Key}`);
              continue;
            }

            const bodyText = await data.Body.transformToString();
            const batchData = JSON.parse(bodyText);

            // Validate the schema structure
            if (!batchData.batch_metadata || !batchData.logs || !Array.isArray(batchData.logs)) {
              console.warn(`Invalid schema in file: ${object.Key}`);
              errorCount++;
              continue;
            }
            
            allLogs.push(...batchData.logs);
            totalBatches++;
            processedFiles++;
            
          } catch (fileError: any) {
            console.error(`Failed to fetch/parse ${object.Key}:`, fileError.message);
            errorCount++;
          }
        }
        
      } catch (prefixError: any) {
        console.error(`Failed to list objects for prefix ${prefix}:`, prefixError.message);
        errorCount++;
      }
    }
    
    console.log(`Processing complete. Total logs: ${allLogs.length}, Batches: ${totalBatches}, Files: ${processedFiles}, Errors: ${errorCount}`);
    
    // Sort logs by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Group logs by service for summary statistics
    const serviceStats: Record<string, any> = {};
    allLogs.forEach(log => {
      const service = log.service;
      if (!serviceStats[service]) {
        serviceStats[service] = {
          count: 0,
          levels: new Set(),
          topics: new Set()
        };
      }
      serviceStats[service].count++;
      serviceStats[service].levels.add(log.level);
      serviceStats[service].topics.add(log.kafka_metadata?.topic);
    });
    
    // Convert Sets to Arrays for JSON serialization
    Object.keys(serviceStats).forEach(service => {
      serviceStats[service].levels = Array.from(serviceStats[service].levels);
      serviceStats[service].topics = Array.from(serviceStats[service].topics);
    });
    
    const response = {
      message: allLogs,
      metadata: {
        dateRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString()
        },
        totalLogs: allLogs.length,
        totalBatches,
        processedFiles,
        errorCount,
        prefixesSearched: prefixes.length,
        serviceStats
      }
    };
    for (const [key,value] of Object.entries(process.memoryUsage())){
      console.log(`Memory usage by ${key}, ${value/1000000}MB `)
    }
    res.json(response);
    
  } catch (error: any) {
    console.error('S3 Kafka logs fetch error:', error); 
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const athena = async (req: Request, res: Response) => {
  

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let { query } = req.body;
    if(query === "getAllEvents"){
      query = ALL_EVENTS;
    }else if (query === "getSitePerformance"){
      query = SITE_PERFORMANCE;
    }else if (query === "getSiteResourceAnalysis"){
      query = SITE_RESOURCE_ANALYSIS;
    }

  if(req.body.query !=="getSitePerformance"){
    const validation = parseAndValidateSQL(query);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid SQL query', details: validation.error });
    }
  }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    console.log('Executing query:', query);
    const startTime = Date.now();

    // Step 1: Start query execution
    const startQueryParams = {
      QueryString: query,
      QueryExecutionContext: {
        Database: ATHENA_DATABASE,
      },
      ResultConfiguration: {
        OutputLocation: ATHENA_OUTPUT_LOCATION,
      },
    };

    const startCommand = new StartQueryExecutionCommand(startQueryParams);
    const startResponse = await athenaClient.send(startCommand);
    const queryExecutionId = startResponse.QueryExecutionId;

    if (!queryExecutionId) {
      throw new Error('Failed to start query execution');
    }

    const queryCompleted = await waitForQueryCompletion(queryExecutionId);
    
    if (!queryCompleted.success) {
      return res.status(500).json({
        error: queryCompleted.error || 'Query execution failed',
        query: query,
        queryExecutionId: queryExecutionId,
      });
    }

    // Step 3: Get query results
    const resultsParams = {
      QueryExecutionId: queryExecutionId,
      MaxResults: 1000, // Adjust based on your needs
    };

    const resultsCommand = new GetQueryResultsCommand(resultsParams);
    const resultsResponse = await athenaClient.send(resultsCommand);

    // Parse results
    const results = parseAthenaResults(resultsResponse.ResultSet?.Rows || []);
    
    const executionTime = Date.now() - startTime;
    console.log(`Query completed in ${executionTime}ms, returned ${results.length} rows`);

    // Return results
    res.status(200).json({
      results: results,
      query: query,
      queryExecutionId: queryExecutionId,
      executionTime: executionTime,
    });

  } catch (error: any) {
    console.error('Error executing Athena query:', error);
    res.status(500).json({
      error: 'Query execution failed',
      message: error.message || 'Unknown error occurred',
      query: req.body?.query,
    });
  }
};

// Helper function to wait for query completion
async function waitForQueryCompletion(queryExecutionId: string): Promise<{ success: boolean; error?: string }> {
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < QUERY_TIMEOUT_MS) {
    try {
      const command = new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      });
      
      const response = await athenaClient.send(command);
      const status = response.QueryExecution?.Status?.State;
      
      console.log(`Query ${queryExecutionId} status: ${status}`);
      
      switch (status) {
        case QueryExecutionState.SUCCEEDED:
          return { success: true };
          
        case QueryExecutionState.FAILED:
          return {
            success: false,
            error: response.QueryExecution?.Status?.StateChangeReason || 'Query failed',
          };
          
        case QueryExecutionState.CANCELLED:
          return {
            success: false,
            error: 'Query was cancelled',
          };
          
        case QueryExecutionState.QUEUED:
        case QueryExecutionState.RUNNING:
          // Continue waiting
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
          break;
          
        default:
          return {
            success: false,
            error: `Unknown query state: ${status}`,
          };
      }
    } catch (error) {
      console.error('Error checking query status:', error);
      return {
        success: false,
        error: error.message || 'Failed to check query status',
      };
    }
  }
  
  return {
    success: false,
    error: 'Query execution timeout',
  };
}

// Helper function to parse Athena results into JSON objects
function parseAthenaResults(rows): any[] {
  if (rows.length === 0) {
    return [];
  }
  
  // First row contains column names
  const headerRow = rows[0];
  const columnNames = headerRow.Data?.map(col => col.VarCharValue || '') || [];
  
  // Parse data rows
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowData: any = {};
    
    row.Data?.forEach((cell, index) => {
      const columnName = columnNames[index];
      // Convert value to appropriate type
      const value = cell.VarCharValue;
      
      // Try to parse as number if possible
      if (value !== null && value !== undefined && value !== '') {
        if (!isNaN(Number(value))) {
          rowData[columnName] = Number(value);
        } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
          rowData[columnName] = value.toLowerCase() === 'true';
        } else {
          rowData[columnName] = value;
        }
      } else {
        rowData[columnName] = null;
      }
    });
    
    results.push(rowData);
  }
  
  return results;

}

function parseAndValidateSQL(query: string): { valid: boolean; error?: string} {
  
  const parser = new Parser.Parser();
  
  try {
    // Parse the SQL query
    const ast = parser.astify(query, { 
      database: 'Athena' 
    });
    
    if (Array.isArray(ast)) {
      // Multiple statements
      return { valid: false, error: 'Multiple statements not allowed' };
    }
    
    if (ast.type !== 'select') {
      return { valid: false, error: 'Only SELECT statements are allowed' };
    }
    
    // Check for forbidden table names
    const tables = parser.tableList(query);
    const whitelistTables = ['sites','uniquequery'];
    for (const table of tables) {
      const tableName = table.split('::')[2]?.toLowerCase();
      if (!whitelistTables.includes(tableName)) {
        return { valid: false, error: `Access to ${tableName} is forbidden` };
      }
    }

    return { valid: true};
    
  } catch (error) {
    return { 
      valid: false, 
      error: `SQL syntax error: ${error.message}` 
    };
  }
}