"use client"

import { useEffect, useState } from "react";
import { Users, Mail, Phone, CheckCircle, XCircle } from "lucide-react";
import { getfileAttente } from "../api/fileAttente";

type file = {
    id: string;
    nom_complet: string;
    email: string;
    numeroPhone: string;
    isCondition: boolean;
}

const FileAttente = () => {
    const [fileAttente, setFileAttente] = useState<file[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFileAttente = async () => {
        try {
            setLoading(true);
            const data = await getfileAttente();
            setFileAttente(data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("erreur lors de la récupération des abonnés");
            setLoading(false);
        }
    }

    useEffect(() => {
        const fetchRecuperation = async () => {
            try {
                await fetchFileAttente();
            } catch (error: any) {
                console.error("erreur lors de l'initialisation");
            }
        };
        fetchRecuperation();
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-red-600 font-medium">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-8 border-red-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-4 rounded-full">
                            <Users className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Abonnés à la File d'attente
                            </h1>
                            <p className="text-gray-600">
                                {fileAttente.length} {fileAttente.length > 1 ? 'abonnés' : 'abonné'} en attente
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                {fileAttente.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-red-500 to-red-600">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Nom complet
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Numéro de téléphone
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center justify-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Conditions acceptées
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {fileAttente.map((person: any, index: number) => (
                                        <tr 
                                            key={person.id} 
                                            className={`hover:bg-red-50 transition-colors duration-200 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {person.nom_complet}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    {person.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    {person.numeroPhone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {person.isCondition ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Acceptées
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                                                        <XCircle className="w-4 h-4" />
                                                        Non acceptées
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-12 h-12 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Aucun abonné en attente
                        </h3>
                        <p className="text-gray-600">
                            La file d'attente est actuellement vide.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FileAttente