export const processDataForChart = (data) => {
    if (!data) return;
  
    const imageTypes = {};
    data.forEach((row) => {
      const imageType = row.props.children[3].props.children;
      if (imageTypes[imageType]) {
        imageTypes[imageType] += 1;
      } else {
        imageTypes[imageType] = 1;
      }
    });
  
    const labels = Object.keys(imageTypes);
    const values = Object.values(imageTypes);
  
    return {
      labels,
      datasets: [
        {
          label: 'Stats by Image Type',
          data: values,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
};

export const processDataForDonutChart = (data) => {
    if (!data) return;
  
    const dates = {};
    data.forEach((row) => {
        
        const preDate = new Date(row.props.children[5].props.children);

        const day = preDate.getDate();
        const month = preDate.getMonth() + 1;
        const year = preDate.getFullYear();

        const formattedDate = `${month}/${day}/${year}`;
        const date = formattedDate;
        if (dates[date]) {
            dates[date] += 1;
        } else {
            dates[date] = 1;
        }
    });
  
    const labels = Object.keys(dates);
    const values = Object.values(dates);
  
    return {
      labels,
      datasets: [
        {
          label: 'Stats by Date',
          data: values,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };  