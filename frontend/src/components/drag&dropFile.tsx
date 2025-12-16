import { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { addToast } from '@heroui/toast';

interface DragDropFileProps {
  label?: string;
  description?: string;
  accept?: string; // tipos de archivos permitidos, ej: "image/*,.pdf"
  buttonText?: string;
  buttonColor?: "primary" | "secondary" | "success" | "danger" | "warning";
  buttonSize?: "sm" | "md" | "lg";
  multiple?: boolean;
  maxFiles?: number; // límite de archivos
  maxSize?: number; // tamaño máximo por archivo en bytes
  onFilesSelected?: (files: File[]) => void;
}

export default function DragDropFile({
  label = "Sube tu archivo",
  description = "Arrastra aquí o usa el botón",
  accept = "*",
  buttonText = "📂 Seleccionar archivo",
  buttonColor = "primary",
  buttonSize = "md",
  multiple = false,
  maxFiles = Infinity,
  maxSize,
  onFilesSelected,
}: DragDropFileProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null); // limpiar error previo

    // Convertir FileList a array y aplicar límite
    const selectedFiles = Array.from(files).slice(0, maxFiles);

    for (const file of selectedFiles) {
      // Validar tipo de archivo
      if (accept !== "*" && accept && !file.type.match(accept.replace("*", ".*"))) {
        const msg = `El archivo "${file.name}" no es un tipo permitido (${accept})`;
        setError(msg);
        addToast({
          title: "Tipo de archivo inválido",
          description: msg,
          color: "danger",
        });
        return;
      }

      // Validar tamaño
      if (maxSize && file.size > maxSize) {
        const msg = `El archivo "${file.name}" supera el tamaño máximo de ${Math.round(
          maxSize / 1024 / 1024
        )}MB`;
        setError(msg);
        addToast({
          title: "Archivo demasiado grande",
          description: msg,
          color: "danger",
        });
        return;
      }
    }

    const urls: string[] = [];
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          urls.push(e.target?.result as string);
          setPreviews((prev) =>
            maxFiles === 1 ? [urls[0]] : [...prev, ...urls].slice(0, maxFiles)
          );
        };
        reader.readAsDataURL(file);
      } else {
        // Para archivos no-imagen, solo mostrar nombre
        urls.push(`FILE:${file.name}`);
        setPreviews((prev) =>
          maxFiles === 1 ? [urls[0]] : [...prev, ...urls].slice(0, maxFiles)
        );
      }
    });

    onFilesSelected?.(selectedFiles);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
        ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-default-200"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {/* Texto guía */}
      <p className="text-sm font-semibold mb-2">{label}</p>
      <p className="text-xs text-default-600 mb-4">{description}</p>

      {/* Botón estilizado */}
      <Button
        color={buttonColor}
        size={buttonSize}
        onPress={() => inputRef.current?.click()}
      >
        {buttonText}
      </Button>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error inline */}
      {error && (
        <p className="mt-2 text-sm text-danger font-medium">{error}</p>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div
          className={`mt-4 grid ${
            maxFiles === 1 ? "grid-cols-1" : "grid-cols-2"
          } gap-4`}
        >
          {previews.map((src, i) =>
            src.startsWith("FILE:") ? (
              <div
                key={i}
                className="p-2 border rounded-lg text-sm text-default-600"
              >
                📄 {src.replace("FILE:", "")}
              </div>
            ) : (
              <img
                key={i}
                src={src}
                alt={`Preview ${i}`}
                className="rounded-lg max-h-40 mx-auto border"
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
