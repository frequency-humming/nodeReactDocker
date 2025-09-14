import { useState, useEffect } from "react";

const useFetch = () => {
  const [data, setData] = useState(false);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [loading, isLoading] = useState(true);

  useEffect(() => {
    const abortCont = new AbortController();

    fetch("/api", { signal: abortCont.signal })
      .then((res) => res.json())
      .then((data) => {
        const items = data.message.map((row) => {
          return (
            <tr>
              <td>{row.Id}</td>
              <td>{row.App}</td>
              <td>{row.User}</td>
              <td>{row.Image}</td>
              <td>{row.Login}</td>
              <td>{row.Date}</td>
            </tr>
          );
        });
        setData(items);
        setError(null);
        setRefresh(true);
        isLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          console.log("fetch aborted");
        } else {
          setError(true);
        }
      });
    return () => abortCont.abort();
  }, []);

  return { data, refresh, error };
};

export default useFetch;
