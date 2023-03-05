import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

const Notification = () => {

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Listen for new messages from each server
        socket.on('salesforce', (message) => {
          console.log('Received new message from server 1:', message);
          const item = JSON.parse(message);
          const items =
                <tr>
                    <td>{item.Id}</td>
                    <td>{item.App}</td>
                    <td>{item.User__c}</td>
                    <td>{item.Image_Type}</td>
                    <td>{item.Login_Type}</td>
                    <td>{item.Created_At}</td>
                </tr>
          setMessages([...messages, items]); // Add new message to existing list of messages
        });
    }, [messages]);
    
        return (
            <div>
                <h1>Helllo</h1>
                <div>
                {messages}
                </div>
            </div>
        );

}

export default Notification;