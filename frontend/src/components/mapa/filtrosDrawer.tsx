// src/components/mapa/FiltrosDrawer.tsx
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { useState } from "react";
import { exportPDF, Filtros } from "@/utils/exportPDF";

interface Props {
    onFilter: (filtros: Filtros) => void;
    map: React.RefObject<L.Map>;
}

export default function FiltrosDrawer({ onFilter, map }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [filtros, setFiltros] = useState<Filtros>({});

    const aplicarFiltros = (onClose: () => void) => {
        onFilter(filtros);
        onClose();
    };

    return (
        <>
            <Button onPress={() => setIsOpen(true)} color="primary">
                Abrir filtros
            </Button>
            <Drawer isOpen={isOpen} onOpenChange={setIsOpen} placement="left" backdrop="blur">
                <DrawerContent className="z-50">
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">
                                Filtros de denuncias
                            </DrawerHeader>
                            <DrawerBody className="flex flex-col gap-6">
                                {/* Ubicación */}
                                <Select
                                    label="Departamento / Ciudad"
                                    placeholder="Selecciona ubicación"
                                    selectedKeys={filtros.departamento ? [filtros.departamento] : []}
                                    onSelectionChange={(keys) =>
                                        setFiltros({ ...filtros, departamento: Array.from(keys)[0] as string })
                                    }
                                >
                                    <SelectItem key="">Todos</SelectItem>
                                    <SelectItem key="Cochabamba">Cochabamba</SelectItem>
                                    <SelectItem key="La Paz">La Paz</SelectItem>
                                    <SelectItem key="Santa Cruz">Santa Cruz</SelectItem>
                                    <SelectItem key="Potosí">Potosí</SelectItem>
                                    <SelectItem key="Tarija">Tarija</SelectItem>
                                    <SelectItem key="Oruro">Oruro</SelectItem>
                                    <SelectItem key="Beni">Trinidad</SelectItem>
                                    <SelectItem key="Pando">Cobija</SelectItem>
                                </Select>

                                {/* Tipo de caso */}
                                <Select
                                    label="Tipo de caso"
                                    placeholder="Selecciona tipo"
                                    selectedKeys={filtros.tipo ? [filtros.tipo] : []}
                                    onSelectionChange={(keys) =>
                                        setFiltros({ ...filtros, tipo: Array.from(keys)[0] as string })
                                    }
                                >
                                    <SelectItem key="">Todos</SelectItem>
                                    <SelectItem key="Corrupción">Corrupción</SelectItem>
                                    <SelectItem key="Narcotráfico">Narcotráfico</SelectItem>
                                    <SelectItem key="Lavado de dinero">Lavado de dinero</SelectItem>
                                    <SelectItem key="Enriquecimiento ilícito">Enriquecimiento ilícito</SelectItem>
                                    <SelectItem key="Complicidad">Complicidad</SelectItem>
                                    <SelectItem key="Violencia">Violencia</SelectItem>
                                </Select>

                                {/* Cantidad mínima */}
                                <Input
                                    type="number"
                                    label="Cantidad mínima"
                                    placeholder="Ej: 50"
                                    min={0}
                                    step={1}
                                    value={filtros.cantidadMin?.toString() || ""}
                                    onChange={(e) =>
                                        setFiltros({ ...filtros, cantidadMin: Number(e.target.value) })
                                    }
                                />
                            </DrawerBody>
                            <DrawerFooter>
                                <Button
                                    color="secondary"
                                    onPress={() => {
                                        console.log("Botón Descargar PDF presionado", filtros, map.current);
                                        if (map.current) {
                                            exportPDF(filtros, map.current);
                                        } else {
                                            console.warn("map.current está vacío, el mapa aún no está listo");
                                        }
                                    }}
                                >
                                    Descargar como PDF
                                </Button>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                                <Button color="primary" onPress={() => aplicarFiltros(onClose)}>
                                    Aplicar
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
