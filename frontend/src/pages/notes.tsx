import "bootstrap-icons/font/bootstrap-icons.css";
import React, { useState, useEffect } from "react";
import { PatientNote } from "../services/notesService";    // Importeer het type PatientNote om de +notitie knop te gebruiken

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
    onDelete: (note: PatientNote) => void; // Nieuw: geef het hele object mee
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

                {/* Inhoud */}
                <div className="text-sm">
                    <span className="font-medium text-gray-800">
                        {highlightText(note.title, searchTerm)}
                    </span>
                    <div className="text-gray-700" title={note.content}>
                        {highlightText(snippet, searchTerm)}
                    </div>
                </div>

                {/* Actieknoppen */}
                <div className="col-span-5 mt-4 flex gap-3 justify-end">
                    <button
                        onClick={() => onView(note)}
                        className="p-2 rounded-lg border border-primary text-primary hover:bg-blue-50 transition-colors"
                        title="Bekijken"
                    >
                        <i className="bi bi-eye-fill fs-5"></i>
                    </button>
                    <button
                        onClick={() => onEdit(note)}
                        className="p-2 rounded-lg border border-success text-success hover:bg-green-50 transition-colors"
                        title="Bewerken"
                    >
                        <i className="bi bi-pencil-fill fs-5"></i>
                    </button>
                    <button
                        onClick={() => onDelete(note)}
                        className="p-2 rounded-lg border border-danger text-danger hover:bg-red-50 transition-colors"
                        title="Verwijderen"
                    >
                        <i className="bi bi-trash-fill fs-5"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Dummy data
const DUMMY_NOTES: PatientNote[] = [
    {
        id: "dummy-1",
        patientId: "p1",
        patientName: "Emma Thompson",
        title: "camiel",
        content: "test inhoud van notitie",
        createdAt: new Date("2025-10-27T12:14:00"),
        specialistName: "Dr. Johannes Doe",
    },
];

type ModalMode = "create" | "edit" | "view" | "delete"; // Nieuw: delete toegevoegd

const Notes: React.FC = () => {
    const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<PatientNote[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("create");
    const [selectedNote, setSelectedNote] = useState<PatientNote | null>(null);
    const [form, setForm] = useState({ patient: "", title: "", content: "" });

    useEffect(() => {
        setPatientNotes(DUMMY_NOTES);
    }, []);

    const isNoteMatch = (note: PatientNote, term: string): boolean => {
        if (!term.trim()) return false;
        const lower = term.toLowerCase();
        return (
            note.title.toLowerCase().includes(lower) ||
            note.content.toLowerCase().includes(lower) ||
            note.patientName.toLowerCase().includes(lower) ||
            note.specialistName.toLowerCase().includes(lower)
        );
    };

    useEffect(() => {
        setFilteredNotes(
            searchTerm.trim()
                ? patientNotes.filter((n) => isNoteMatch(n, searchTerm))
                : patientNotes
        );
    }, [patientNotes, searchTerm]);

    // Nieuw: modale helpers
    const openModal = (mode: ModalMode, note?: PatientNote) => {
        setModalMode(mode);
        setSelectedNote(note || null);
        if (mode === "edit" && note) {
            setForm({
                patient: note.patientName,
                title: note.title,
                content: note.content,
            });
        } else if (mode === "create") {
            setForm({ patient: "", title: "", content: "" });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedNote(null);
        setForm({ patient: "", title: "", content: "" });
    };

    // Nieuw: knoppen logica
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (modalMode === "create") {
            alert("Bedankt voor het aanmaken van een notitie");
        } else if (modalMode === "edit" && selectedNote) {
            setPatientNotes((prev) =>
                prev.map((n) =>
                    n.id === selectedNote.id
                        ? { ...n, patientName: form.patient, title: form.title, content: form.content }
                        : n
                )
            );
            alert("Notitie aangepast");
        } else if (modalMode === "delete" && selectedNote) {
            setPatientNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
            alert("Notitie verwijderd");
        }
        closeModal();
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
                    {/* Zoekbalk */}
                    <div className="p-4 border-b border-gray-200">
                        <input
                            type="text"
                            placeholder="Zoek op datum, patiënt, specialist of inhoud."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tabelkoppen */}
                    <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-5 gap-1 items-center text-gray-500 font-semibold text-sm">
                            <span>Datum</span>
                            <span>Tijd</span>
                            <span>Patiënt</span>
                            <span>Specialist</span>
                            <span>Inhoud</span>
                        </div>
                    </div>

                    {/* Lijst */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredNotes.map((note) => (
                            <PatientNoteListItem
                                key={note.id}
                                note={note}
                                searchTerm={searchTerm}
                                isMatch={isNoteMatch(note, searchTerm)}
                                onView={() => openModal("view", note)}
                                onEdit={() => openModal("edit", note)}
                                onDelete={() => openModal("delete", note)} // Nieuw: custom delete popup
                            />
                        ))}
                    </div>

                    {/* + knop */}
                    <button
                        onClick={() => openModal("create")}
                        className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <i className="bi bi-plus-lg text-lg"></i>
                        <span className="font-medium">Notitie toevoegen</span>
                    </button>
                </div>
            </div>

            {/* Nieuw: gedeelde modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl p-6">
                        <div className="flex items-start justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {modalMode === "create"
                                    ? "Nieuwe notitie"
                                    : modalMode === "edit"
                                        ? "Notitie aanpassen"
                                        : modalMode === "view"
                                            ? "Notitie bekijken"
                                            : "Notitie verwijderen"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            >
                                <i className="bi bi-x-lg text-xl"></i>
                            </button>
                        </div>

                        {/* Nieuw: inhoud per modus */}
                        {modalMode === "view" && selectedNote && (
                            <div className="mt-5 space-y-3 text-gray-800">
                                <p><strong>Datum:</strong> {selectedNote.createdAt.toLocaleDateString("nl-NL")}</p>
                                <p><strong>Tijd:</strong> {selectedNote.createdAt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</p>
                                <p><strong>Specialist:</strong> {selectedNote.specialistName}</p>
                                <p><strong>Inhoud:</strong> {selectedNote.content}</p>
                            </div>
                        )}

                        {(modalMode === "create" || modalMode === "edit") && (
                            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Notitie voor
                                    </label>
                                    <input
                                        type="text"
                                        value={form.patient}
                                        placeholder="Bijv. Emma Thompson"
                                        onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Titel <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                        placeholder="Bijv. Controle afspraak"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Inhoud <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.content}
                                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                        placeholder="Schrijf hier de notitie..."
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Nieuw: groene bevestigen + rode annuleren */}
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Bevestigen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                    >
                                        Annuleren
                                    </button>
                                </div>
                            </form>
                        )}

                        {modalMode === "delete" && selectedNote && (
                            <form className="mt-6 space-y-6 text-center" onSubmit={handleSubmit}>
                                <p className="text-gray-800 text-lg font-medium">
                                    Weet je zeker dat je deze notitie wilt verwijderen?
                                </p>
                                <div className="flex justify-center gap-3 mt-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Bevestigen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                    >
                                        Annuleren
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notes;
