import { useEffect, useState } from "react";

interface Card {
  id: string;
  title: string;
  description: string;
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

const columns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      {
        id: "1",
        title: "Design homepage",
        description: "Create wireframes and mockups for the landing page",
      },
      {
        id: "2",
        title: "Setup database",
        description: "Configure PostgreSQL and create initial schema",
      },
      {
        id: "3",
        title: "Write API docs",
        description: "Document all endpoints and authentication methods",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      {
        id: "4",
        title: "Build login form",
        description: "Implement authentication UI and validation",
      },
      {
        id: "5",
        title: "Setup CI/CD",
        description: "Configure GitHub Actions for automated testing",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      {
        id: "6",
        title: "Initialize project",
        description: "Create Next.js project and install dependencies",
      },
      {
        id: "7",
        title: "Setup Tailwind CSS",
        description: "Configure Tailwind and create base styles",
      },
      {
        id: "8",
        title: "Create project repo",
        description: "Initialize Git repository and push initial commit",
      },
    ],
  },
];

export default function KanbanBoard() {
  const [userEmail, setUserEmail] = useState("");

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
        alert("Logged in");
        setUserEmail(res.user.email);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => (window.location.href = "/login"));
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
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white p-4 rounded-md border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="font-medium text-slate-900 text-sm mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
