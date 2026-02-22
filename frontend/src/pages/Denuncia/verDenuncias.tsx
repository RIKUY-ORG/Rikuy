// src/pages/denuncias/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
    FileText,
    MapPin,
    Clock,
    Filter,
    Search,
    Eye,
    CheckCircle,
    AlertCircle,
    Image,
    Video,
    Mic,
    Users,
    ArrowRight,
    MessageCircle
} from "lucide-react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { CATEGORY_NAMES, CATEGORIES, type CategoryKey } from "@/config/rikuy";
import { usePrivy } from "@privy-io/react-auth";
import { useAvatarContext } from "@/context/avatarContext";

// Tipos para las denuncias
interface Denuncia {
    id: string;
    titulo: string;
    descripcion: string;
    categoria: CategoryKey;
    ubicacion: {
        ciudad: string;
        departamento: string;
        lat?: number;
        lng?: number;
    };
    fecha: string;
    evidencia: {
        tipo: 'photo' | 'video' | 'audio' | 'document';
        count: number;
    };
    estado: 'verificada' | 'pendiente' | 'en_revision';
    verificaciones: number;
    comentarios: number;
    aliadosInteresados: number;
    autor: {
        tipo: 'ciudadano' | 'comunidad';
        nombre: string;
        avatar?: any;
    };
}

// Datos de ejemplo para demostración
const denunciasMock: Denuncia[] = [
    {
        id: "DEN-001",
        titulo: "Bache peligroso en avenida principal",
        descripcion: "Hace 3 meses que hay un bache que ha causado múltiples accidentes. Las autoridades no hacen nada.",
        categoria: "INFRAESTRUCTURA",
        ubicacion: {
            ciudad: "El Alto",
            departamento: "La Paz",
        },
        fecha: "2026-02-20T15:30:00",
        evidencia: {
            tipo: "photo",
            count: 3,
        },
        estado: "verificada",
        verificaciones: 45,
        comentarios: 12,
        aliadosInteresados: 3,
        autor: {
            tipo: "ciudadano",
            nombre: "Vecino de El Alto",
        },
    },
    {
        id: "DEN-002",
        titulo: "Funcionario pide coima para agilizar trámite",
        descripcion: "En la alcaldía, un funcionario solicitó dinero para dar curso a un permiso de construcción.",
        categoria: "CORRUPCION",
        ubicacion: {
            ciudad: "Santa Cruz",
            departamento: "Santa Cruz",
        },
        fecha: "2026-02-19T10:15:00",
        evidencia: {
            tipo: "audio",
            count: 2,
        },
        estado: "en_revision",
        verificaciones: 18,
        comentarios: 5,
        aliadosInteresados: 2,
        autor: {
            tipo: "ciudadano",
            nombre: "Empresario local",
        },
    },
    {
        id: "DEN-003",
        titulo: "Contaminación del río por desechos industriales",
        descripcion: "Una fábrica está vertiendo desechos tóxicos al río. Los peces están muriendo.",
        categoria: "BASURA",
        ubicacion: {
            ciudad: "Cochabamba",
            departamento: "Cochabamba",
        },
        fecha: "2026-02-18T08:45:00",
        evidencia: {
            tipo: "video",
            count: 1,
        },
        estado: "verificada",
        verificaciones: 67,
        comentarios: 23,
        aliadosInteresados: 5,
        autor: {
            tipo: "comunidad",
            nombre: "Comunidad de Tiquipaya",
        },
    },
    {
        id: "DEN-004",
        titulo: "Venta de drogas en parque infantil",
        descripcion: "Narcotraficantes usan el parque como punto de venta. Los niños no pueden jugar.",
        categoria: "INSEGURIDAD",
        ubicacion: {
            ciudad: "Oruro",
            departamento: "Oruro",
        },
        fecha: "2026-02-17T19:20:00",
        evidencia: {
            tipo: "video",
            count: 2,
        },
        estado: "pendiente",
        verificaciones: 8,
        comentarios: 3,
        aliadosInteresados: 1,
        autor: {
            tipo: "ciudadano",
            nombre: "Madre de familia",
        },
    },
    {
        id: "DEN-005",
        titulo: "Colegio sin mantenimiento por años",
        descripcion: "Las aulas están en mal estado, techos con goteras y baños insalubres.",
        categoria: "INFRAESTRUCTURA",
        ubicacion: {
            ciudad: "Potosí",
            departamento: "Potosí",
        },
        fecha: "2026-02-16T14:10:00",
        evidencia: {
            tipo: "photo",
            count: 5,
        },
        estado: "verificada",
        verificaciones: 34,
        comentarios: 9,
        aliadosInteresados: 2,
        autor: {
            tipo: "comunidad",
            nombre: "Comunidad educativa",
        },
    },
    {
        id: "DEN-006",
        titulo: "Soborno en licitación municipal",
        descripcion: "Funcionarios municipales recibieron sobornos para adjudicar una licitación.",
        categoria: "CORRUPCION",
        ubicacion: {
            ciudad: "Tarija",
            departamento: "Tarija",
        },
        fecha: "2026-02-15T11:30:00",
        evidencia: {
            tipo: "document",
            count: 4,
        },
        estado: "en_revision",
        verificaciones: 22,
        comentarios: 7,
        aliadosInteresados: 4,
        autor: {
            tipo: "ciudadano",
            nombre: "Exfuncionario",
        },
    },
];

// Departamentos de Bolivia
const departamentos = [
    "Todos",
    "La Paz",
    "Santa Cruz",
    "Cochabamba",
    "Oruro",
    "Potosí",
    "Tarija",
    "Chuquisaca",
    "Beni",
    "Pando",
];

// Definir el tipo de las opciones
type CategoryOption = {
    key: string;
    label: string;
};

const categoryOptions: CategoryOption[] = [
    { key: "TODAS", label: "Todas" },
    ...Object.keys(CATEGORIES).map((cat) => ({
        key: cat,
        label: CATEGORY_NAMES[cat as CategoryKey]
    }))
];


export default function DenunciasPage() {
    const navigate = useNavigate();
    const { authenticated } = usePrivy();
    const { AvatarComp } = useAvatarContext();

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
    const [selectedDepartamento, setSelectedDepartamento] = useState("Todos");
    const [selectedEstado, setSelectedEstado] = useState("TODOS");
    const [sortBy, setSortBy] = useState<"recientes" | "verificadas" | "comentarios">("recientes");

    // Estado para las denuncias (simulado)
    const [denuncias] = useState<Denuncia[]>(denunciasMock);
    const [filteredDenuncias, setFilteredDenuncias] = useState<Denuncia[]>(denunciasMock);
    const [isLoading, setIsLoading] = useState(false);

    // Simular carga inicial
    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    // Filtrar denuncias cuando cambian los filtros
    useEffect(() => {
        let filtered = [...denuncias];

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(d =>
                d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por categoría
        if (selectedCategory !== "TODAS") {
            filtered = filtered.filter(d => d.categoria === selectedCategory);
        }

        // Filtro por departamento
        if (selectedDepartamento !== "Todos") {
            filtered = filtered.filter(d => d.ubicacion.departamento === selectedDepartamento);
        }

        // Filtro por estado
        if (selectedEstado !== "TODOS") {
            filtered = filtered.filter(d => d.estado === selectedEstado);
        }

        // Ordenamiento
        filtered.sort((a, b) => {
            if (sortBy === "recientes") {
                return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
            } else if (sortBy === "verificadas") {
                return b.verificaciones - a.verificaciones;
            } else {
                return b.comentarios - a.comentarios;
            }
        });

        setFilteredDenuncias(filtered);
    }, [searchTerm, selectedCategory, selectedDepartamento, selectedEstado, sortBy, denuncias]);

    // Si no está autenticado, redirigir al inicio
    if (!authenticated) {
        navigate('/');
        return null;
    }

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'verificada': return 'success';
            case 'en_revision': return 'warning';
            case 'pendiente': return 'default';
            default: return 'default';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'verificada': return 'Verificada';
            case 'en_revision': return 'En revisión';
            case 'pendiente': return 'Pendiente';
            default: return estado;
        }
    };

    const getEvidenciaIcon = (tipo: string) => {
        switch (tipo) {
            case 'photo': return <Image size={16} />;
            case 'video': return <Video size={16} />;
            case 'audio': return <Mic size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const formatFecha = (fecha: string) => {
        const date = new Date(fecha);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 24) {
            return `Hace ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`;
        } else {
            return date.toLocaleDateString('es-BO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col gap-6 py-6 md:py-8 px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className={title()}>Denuncias ciudadanas</h1>
                        <p className="text-default-500 text-sm mt-1">
                            Explora las denuncias verificadas por la comunidad
                        </p>
                    </div>

                    {/* Botón nueva denuncia */}
                    <Button
                        as="a"
                        href="/denunciar"
                        color="primary"
                        size="lg"
                        startContent={<FileText size={18} />}
                        className="font-semibold"
                    >
                        Nueva denuncia
                    </Button>
                </div>

                {/* Stats rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-primary-50 dark:bg-primary-900/20">
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                                <FileText size={20} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary-600">{denuncias.length}</p>
                                <p className="text-xs text-default-500">Total denuncias</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-success-50 dark:bg-success-900/20">
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="p-2 bg-success-100 dark:bg-success-800 rounded-lg">
                                <CheckCircle size={20} className="text-success-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-success-600">
                                    {denuncias.filter(d => d.estado === 'verificada').length}
                                </p>
                                <p className="text-xs text-default-500">Verificadas</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-warning-50 dark:bg-warning-900/20">
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="p-2 bg-warning-100 dark:bg-warning-800 rounded-lg">
                                <Eye size={20} className="text-warning-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-warning-600">
                                    {denuncias.reduce((acc, d) => acc + d.verificaciones, 0)}
                                </p>
                                <p className="text-xs text-default-500">Verificaciones</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-secondary-50 dark:bg-secondary-900/20">
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="p-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                                <Users size={20} className="text-secondary-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-secondary-600">
                                    {denuncias.reduce((acc, d) => acc + d.aliadosInteresados, 0)}
                                </p>
                                <p className="text-xs text-default-500">Aliados interesados</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Filtros */}
                <Card className="sticky top-20 z-40">
                    <CardBody className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Búsqueda */}
                            <Input
                                placeholder="Buscar denuncias..."
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                startContent={<Search size={18} className="text-default-400" />}
                                className="flex-1"
                                size="sm"
                            />

                            {/* Filtros en grid responsivo */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                                <Select
                                    placeholder="Categoría"
                                    selectedKeys={[selectedCategory]}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    size="sm"
                                    startContent={<Filter size={16} className="text-default-400" />}
                                >
                                    {categoryOptions.map((option) => (
                                        <SelectItem key={option.key} textValue={option.label}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    placeholder="Departamento"
                                    selectedKeys={[selectedDepartamento]}
                                    onChange={(e) => setSelectedDepartamento(e.target.value)}
                                    size="sm"
                                    startContent={<MapPin size={16} className="text-default-400" />}
                                >
                                    {departamentos.map((dep) => (
                                        <SelectItem key={dep} textValue={dep}>{dep}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    placeholder="Estado"
                                    selectedKeys={[selectedEstado]}
                                    onChange={(e) => setSelectedEstado(e.target.value)}
                                    size="sm"
                                >
                                    <SelectItem key="TODOS" textValue="Todos">Todos</SelectItem>
                                    <SelectItem key="verificada" textValue="Verificadas">Verificadas</SelectItem>
                                    <SelectItem key="en_revision" textValue="En revisión">En revisión</SelectItem>
                                    <SelectItem key="pendiente" textValue="Pendientes">Pendientes</SelectItem>
                                </Select>

                                <Select
                                    placeholder="Ordenar por"
                                    selectedKeys={[sortBy]}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    size="sm"
                                >
                                    <SelectItem key="recientes" textValue="Más recientes">Más recientes</SelectItem>
                                    <SelectItem key="verificadas" textValue="Más verificadas">Más verificadas</SelectItem>
                                    <SelectItem key="comentarios" textValue="Más comentadas">Más comentadas</SelectItem>
                                </Select>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Lista de denuncias */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
                    </div>
                ) : filteredDenuncias.length === 0 ? (
                    <Card className="py-20">
                        <CardBody className="text-center">
                            <AlertCircle size={48} className="mx-auto mb-4 text-default-400" />
                            <p className="text-lg font-semibold">No hay denuncias</p>
                            <p className="text-sm text-default-500 mt-2">
                                No se encontraron denuncias con los filtros seleccionados.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredDenuncias.map((denuncia, index) => (
                            <motion.div
                                key={denuncia.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.01 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-lg transition-all"
                                    isPressable
                                    onPress={() => navigate(`/denuncias/${denuncia.id}`)}
                                >
                                    <CardBody className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Avatar del autor */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 p-0.5">
                                                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                                                        {denuncia.autor.tipo === 'comunidad' ? (
                                                            <Users size={24} className="text-primary-600" />
                                                        ) : (
                                                            <AvatarComp size={24} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contenido principal */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">{denuncia.titulo}</h3>
                                                        <p className="text-sm text-default-500 mt-1 line-clamp-2">
                                                            {denuncia.descripcion}
                                                        </p>
                                                    </div>
                                                    <Chip
                                                        color={getEstadoColor(denuncia.estado) as any}
                                                        size="sm"
                                                        variant="flat"
                                                        className="self-start"
                                                    >
                                                        {getEstadoTexto(denuncia.estado)}
                                                    </Chip>
                                                </div>

                                                {/* Metadatos */}
                                                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-default-400">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        <span>{denuncia.ubicacion.ciudad}, {denuncia.ubicacion.departamento}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        <span>{formatFecha(denuncia.fecha)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {getEvidenciaIcon(denuncia.evidencia.tipo)}
                                                        <span>{denuncia.evidencia.count} {denuncia.evidencia.count === 1 ? 'archivo' : 'archivos'}</span>
                                                    </div>
                                                    <Chip size="sm" variant="flat" className="text-xs">
                                                        {CATEGORY_NAMES[denuncia.categoria]}
                                                    </Chip>
                                                </div>

                                                {/* Estadísticas */}
                                                <div className="flex items-center gap-4 mt-3 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle size={14} className="text-success-500" />
                                                        <span className="font-medium">{denuncia.verificaciones}</span>
                                                        <span className="text-default-400">verificaciones</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users size={14} className="text-primary-500" />
                                                        <span className="font-medium">{denuncia.aliadosInteresados}</span>
                                                        <span className="text-default-400">aliados</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MessageCircle size={14} className="text-warning-500" />
                                                        <span className="font-medium">{denuncia.comentarios}</span>
                                                        <span className="text-default-400">comentarios</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Flecha indicadora (solo desktop) */}
                                            <div className="hidden sm:flex items-center">
                                                <ArrowRight size={20} className="text-default-400" />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </DefaultLayout>
    );
}