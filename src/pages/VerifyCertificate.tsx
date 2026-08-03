import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/verify/cert/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setCert(d); });
  }, [id]);

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
        <div className="text-5xl mb-3">{cert ? "✅" : "🔍"}</div>
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-600">Certificate Not Found</h1>
            <p className="text-gray-500 mt-2">{error}</p>
          </>
        ) : cert ? (
          <>
            <div className="text-xs font-bold text-green-600 tracking-widest">JOHNWEB · VERIFIED</div>
            <h1 className="text-2xl font-bold mt-2">This certificate is genuine</h1>
            <p className="text-gray-500 mt-1">Issued to</p>
            <div className="text-3xl font-bold text-gray-800 my-3">{cert.holder || cert.name}</div>
            <p className="text-sm text-gray-600">for practicing on the JohnWeb ECZ platform</p>
            <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold text-gray-800">{cert.answers}</div><div className="text-xs text-gray-500">Answers</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold text-gray-800">{cert.pct}%</div><div className="text-xs text-gray-500">Accuracy</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold text-gray-800">L{cert.level}</div><div className="text-xs text-gray-500">Level</div></div>
            </div>
            <p className="text-xs text-gray-400 mt-5">Issued {new Date(cert.issued).toLocaleDateString()}</p>
          </>
        ) : (
          <p className="text-gray-500">Checking certificate...</p>
        )}
        <Link to="/" className="inline-block mt-6 text-sm text-green-600 hover:underline">← JohnWeb Home</Link>
      </div>
    </div>
  );
}
