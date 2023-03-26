import { useState, useEffect } from 'react';
import Notification from './Notification';

const Home = () => {

    const [data, setData] = useState(null);
    const [error,setError] = useState(false);
    const [refresh, setRefresh] = useState(false);
    useEffect(() => {
        fetch("/api")
        .then((res) => res.json())
        .then((data) => {
            const items = data.message.map((row)=> {
                return (
                    <tr>
                    <td>{row.Id}</td>
                    <td>{row.App}</td>
                    <td>{row.User}</td>
                    <td>{row.Image}</td>
                    <td>{row.Login}</td>
                    <td>{row.Date}</td>
                    </tr>
                )
            }
        )
            setData(items);
            setError(null);
            setRefresh(true);
        })
        .catch( err => {
            if(err.name === 'AbortError'){
                console.log('fetch aborted');
            } else {
                setError(err.message);
            }            
        })
    }, []);

  return (
    <div className="home">
        { error && <h2>{error}</h2> }
        { data &&
            <table>
                <tr className="header">
                <th>Id</th>
                <th>App</th>
                <th>User</th>
                <th>Image Type</th>
                <th>Login Type</th>
                <th>Date</th>
                </tr>
                {data} 
            </table>
        }
        <div>{refresh && <Notification />}</div> 
    </div>
  );

}

export default Home;