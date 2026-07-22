import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

export default function KanbanBoard() {
  const [userEmail, setUserEmail] = useState("");
  const [columns, setColumns] = useState<any[]>([]);
  const [addingCardColumnId, setAddingCardColumnId] = useState<string | null>(
    null,
  );
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setDescription] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.message.startsWith("Access denied")) {
          window.location.href = "/login";
          return;
        }
        setUserEmail(res.user.email);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (userEmail) fetchBoard();
  }, [userEmail]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "CARD_UPDATED") {
        console.log("Re fetching board...");
        fetchBoard();
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleLogout = () => {
    fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => (window.location.href = "/login"));
  };

  const fetchBoard = () => {
    fetch("http://localhost:5000/api/boards", { credentials: "include" })
      .then((res) => res.json())
      .then((res) => setColumns(res?.columns ?? []));
  };

  const handleCreateCard = (
    e: ChangeEvent<HTMLFormElement>,
    columnId: string,
  ) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    fetch("http://localhost:5000/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        columnId,
        title: newTitle,
        description: newDescription,
      }),
    })
      .then((res) => res.json())
      .then((newCard) => {
        setNewTitle("");
        setAddingCardColumnId(null);
        setDescription("");
        fetchBoard();
      });
  };

  const handleDeleteCard = (cardId: string) => {
    fetch(`http://localhost:5000/api/cards/${cardId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => {
        fetchBoard();
      });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              My Kanban Board
            </h1>
            <p className="text-slate-600 mt-2">
              Logged in as:{" "}
              <span className="font-semibold text-slate-800">{userEmail}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col bg-white rounded-lg shadow-sm border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-50 to-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">
                  {column.title}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    ({column.cards.length})
                  </span>
                </h2>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {column.cards.map((card: any) => (
                  <div
                    key={card.id}
                    className="group relative bg-white p-4 rounded-md border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-slate-900 text-sm mb-1 pr-4">
                        {card.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          handleDeleteCard(card.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 font-semibold text-xs p-1 rounded transition-opacity"
                        title="Delete card"
                      >
                        ✕
                      </button>
                    </div>

                    {card.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}

                {addingCardColumnId === column.id ? (
                  <form
                    onSubmit={(e) => handleCreateCard(e, column.id)}
                    className="space-y-2 pt-2 bg-slate-50 p-2.5 rounded-md border border-slate-200 mt-2"
                  >
                    <input
                      type="text"
                      placeholder="Enter card title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <textarea
                      placeholder="Enter description (optional)"
                      value={newDescription}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                      >
                        Add Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingCardColumnId(null);
                          setNewTitle("");
                          setDescription("");
                        }}
                        className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="w-full text-left text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 py-2 px-3 rounded-md transition-colors flex items-center gap-1.5 font-medium border border-dashed border-slate-200 mt-2"
                    onClick={() => setAddingCardColumnId(column.id)}
                  >
                    <span>+</span> Add a card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
