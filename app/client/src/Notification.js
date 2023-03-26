import { useState, useEffect } from 'react';

const Notification = () => {

    const [messages, setMessages] = useState(null);

    useEffect(() => {
        const eventSource = new EventSource('api/streaming');
        eventSource.onmessage = (event) => {
            if(event.data === ''){
                console.log('Connected ..');
            }else {
                const item = JSON.parse(event.data);
                const date = new Date(item.Created_At);
                const items =
                    <tr>
                        <td>{item.Id}</td>
                        <td>{item.App}</td>
                        <td>{item.User__c}</td>
                        <td>{item.Image_Type}</td>
                        <td>{item.Login_Type}</td>
                        <td>{date.toLocaleDateString()} {date.toLocaleTimeString()}</td>
                    </tr>
                setMessages(items);
            }
        };
    }, [messages]);
        return (
            <div>
                <h1>Incoming</h1>
                <table>
                    <tr className="header">
                    <th>Id</th>
                    <th>App</th>
                    <th>User</th>
                    <th>Image Type</th>
                    <th>Login Type</th>
                    <th>Date</th>
                    </tr>
                    {messages} 
                </table>
            </div>
        );

}

export default Notification;