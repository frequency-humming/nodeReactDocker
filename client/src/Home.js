import { useState, useEffect } from 'react';

const Home = () => {

    const [data, setData] = useState(null);
    const [error,setError] = useState(false);
    const [isPending, setIsPending] = useState(true);

    useEffect(() => {
        const abortCont = new AbortController();
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
            setIsPending(false);
            setError(null);
        })
        .catch( err => {
            if(err.name === 'AbortError'){
                console.log('fetch aborted');
            } else {
                setError(err.message);
                setIsPending(false);
            }            
        })
        return () => abortCont.abort();
    }, []);

  return (
    <div className="home">
        { error && <h2>{error}</h2> }
        { isPending && <div>Loading...</div> }
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
    </div>
  );

}

export default Home;