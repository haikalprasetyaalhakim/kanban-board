import { useEffect } from "react";
import { useNavigate } from "react-router";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/boards", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((board) => {
        if (board.id) {
          navigate(`/board/${board.id}`);
        } else {
          navigate("/login");
        }
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  return <div className="p-8 text-center">Loading board...</div>;
}
export default App;
