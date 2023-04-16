import Notification from './Notification';
import useFetch from './useFetch';

const Home = () => {

    const {data,refresh,error} = useFetch();    

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