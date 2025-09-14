import Notification from "./Notification";
import useFetch from "./useFetch";
import Spinner from "./Spinner";

const Home = () => {
  const { data, refresh, loading, error } = useFetch();

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="home">
      {error && <Spinner />}
      {data && (
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
      )}
      <div>{refresh && <Notification />}</div>
    </div>
  );
};

export default Home;
