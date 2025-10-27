import React, { useState, useEffect } from "react";
import { PatientNote } from "../services/notesService";

// Utility function to highlight matching text
const highlightText = (text: string, searchTerm: string): JSX.Element => {
    if (!searchTerm.trim()) return <span>{text}</span>;

    const regex = new RegExp(
        `(${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`,
        "gi"
    );
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) =>
                regex.test(part) ? (
                    <mark
                        key={index}
                        className="bg-yellow-200 text-yellow-900 font-medium px-1 rounded"
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
};

// List item — nu uitgelijnd onder de tabelkoppen
const PatientNoteListItem: React.FC<{
    note: PatientNote;
    searchTerm: string;
    isMatch: boolean;
    onView: (note: PatientNote) => void;
    onEdit: (note: PatientNote) => void;
    onDelete: (id: string) => void;
}> = ({ note, searchTerm, isMatch, onView, onEdit, onDelete }) => {
    const formatDateOnly = (date: Date): string =>
        new Date(date).toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

    const formatTimeOnly = (date: Date): string =>
        new Date(date).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const baseClasses = "p-4 border rounded-lg bg-white transition-all duration-200";
    const matchClasses = isMatch
        ? "border-2 border-blue-400 shadow-lg bg-blue-50 ring-2 ring-blue-200"
        : "border-gray-200 hover:bg-gray-50";

    const snippet =
        note.content.length > 80 ? `${note.content.substring(0, 80)}…` : note.content;

    return (
        <div className={`${baseClasses} ${matchClasses}`}>
            {/* 5 kolommen: exact als de header erboven */}
            <div className="grid grid-cols-5 gap-4 items-start">
                {/* Datum */}
                <div className="text-sm text-gray-800">
                    {highlightText(formatDateOnly(note.createdAt), searchTerm)}
                </div>

                {/* Tijd */}
                <div className="text-sm text-gray-800">
                    {highlightText(formatTimeOnly(note.createdAt), searchTerm)}
                </div>

                {/* Patiënt */}
                <div className="text-sm text-gray-800">
                    {highlightText(note.patientName, searchTerm)}
                </div>

                {/* Specialist */}
                <div className="text-sm text-gray-800">
                    {highlightText(note.specialistName, searchTerm)}
                </div>

                {/* Inhoud (titel + snippet) */}
                <div className="text-sm">
                    <a href="#" className="text-blue-600 font-medium">
                        {highlightText(note.title, searchTerm)}
                    </a>
                    <div className="text-gray-700" title={note.content}>
                        {highlightText(snippet, searchTerm)}
                    </div>
                </div>

                {/* Actieknoppen over de volledige breedte */}
                <div className="col-span-5 mt-4 flex gap-2 justify-end">
                    <button
                        onClick={() => onView(note)}
                        className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100"
                    >
                        Bekijken
                    </button>
                    <button
                        onClick={() => onEdit(note)}
                        className="px-3 py-1.5 text-sm rounded border border-blue-500 text-blue-700 hover:bg-blue-50"
                    >
                        Bewerken
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="px-3 py-1.5 text-sm rounded border border-red-500 text-red-700 hover:bg-red-50"
                    >
                        Verwijderen
                    </button>
                </div>
            </div>
        </div>
    );
};

// Hardcoded dummy data
const DUMMY_NOTES: PatientNote[] = [
    {
        id: "dummy-1",
        patientId: "p1",
        patientName: "Emma Thompson",
        title: "camiel",
        content: "test",
        createdAt: new Date("2025-10-27T12:14:00"),
        specialistName: "Dr. Johannes Doe",
    },
];

const Notes: React.FC = () => {
    const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<PatientNote[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        setPatientNotes(DUMMY_NOTES);
    }, []);

    const isNoteMatch = (note: PatientNote, term: string): boolean => {
        if (!term.trim()) return false;
        const searchLower = term.toLowerCase();
        return (
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower) ||
            note.patientName.toLowerCase().includes(searchLower) ||
            note.specialistName.toLowerCase().includes(searchLower)
        );
    };

    useEffect(() => {
        let filtered = [...patientNotes];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((note) =>
                [note.title, note.content, note.patientName, note.specialistName]
                    .map((x) => x.toLowerCase())
                    .some((x) => x.includes(term))
            );
        }
        setFilteredNotes(filtered);
    }, [patientNotes, searchTerm]);

    const handleView = (note: PatientNote) => {
        alert(
            `Notitie bekijken:\n\nTitel: ${note.title}\nDatum: ${note.createdAt.toLocaleString(
                "nl-NL"
            )}\nSpecialist: ${note.specialistName}\nPatiënt: ${note.patientName
            }\n\nInhoud:\n${note.content}`
        );
    };

    const handleEdit = (note: PatientNote) => {
        const newTitle = window.prompt("Nieuwe titel:", note.title);
        if (!newTitle || !newTitle.trim()) return;
        setPatientNotes((prev) =>
            prev.map((n) => (n.id === note.id ? { ...n, title: newTitle.trim() } : n))
        );
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Weet je zeker dat je deze notitie wilt verwijderen?"))
            return;
        setPatientNotes((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="p-6 bg-white border-b border-gray-200">
                <h1 className="text-3xl font-bold text-blue-900">Notities</h1>
                <hr className="mt-3 h-0.5 border-2 border-blue-800 w-32 bg-blue-800" />
            </div>

            {/* Main */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white h-full rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Zoek op datum, patiënt, specialist of inhoud."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchTerm && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        {filteredNotes.length} resultaat
                                        {filteredNotes.length !== 1 ? "en" : ""}
                                    </span>
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                        title="Zoekterm wissen"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabelkoppen */}
                    <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-5 gap-1 items-center">
                            <h2 className="text-sm font-semibold text-gray-500 text-left">Datum</h2>
                            <h2 className="text-sm font-semibold text-gray-500 text-left">Tijd</h2>
                            <h2 className="text-sm font-semibold text-gray-500 text-left">Patiënt</h2>
                            <h2 className="text-sm font-semibold text-gray-500 text-left">Specialist</h2>
                            <h2 className="text-sm font-semibold text-gray-500 text-left">Inhoud</h2>
                        </div>
                    </div>

                    {/* Notities */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                            {filteredNotes.map((note) => (
                                <PatientNoteListItem
                                    key={note.id}
                                    note={note}
                                    searchTerm={searchTerm}
                                    isMatch={isNoteMatch(note, searchTerm)}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notes;
