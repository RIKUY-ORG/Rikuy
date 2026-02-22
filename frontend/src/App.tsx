import { Route, Routes } from "react-router-dom";

import AboutPage from "@/pages/about";
import PrivacidadPage from "./pages/privacidad";
import TerminosPage from "./pages/terminos";
import ContactoPage from "@/pages/contacto";
import TutorialPage from "@/pages/tutorial";
import AyudaPage from "@/pages/ayuda";
import ComoFuncionaPage from "./pages/comoFunciona";
import DenunciasPage from "./pages/Denuncia/verDenuncias";
import DenunciarPage from "./pages/Denuncia";
import PhotoPage from "./pages/Denuncia/foto";
import VideoPage from "./pages/Denuncia/video";
import RecorderPage from "./pages/Denuncia/audio";
import SubirPage from "./pages/Denuncia/subir";
import CrearDenunciaPage from "./pages/Denuncia/crear";
import DenunciaExitosaPage from "./pages/Denuncia/denuncia-exitosa";
import ComunidadesPage from "./pages/Comunidad";
import PerfilPage from "./pages/perfil/index";
import LoginPage from "./pages/login";
import SoportePage from "@/pages/soporte";
import IndexPage from "./pages/Landing";
import MetricsFullPage from "./pages/Map";
import VerificarIdentidadPage from "./pages/verificar-identidad";
import ProtectedRoute from "@/components/ProtectedRoute";
import AliadosPage from "./pages/Aliados";
import DenunciaDetallePage from "./pages/Denuncia/detalleDenuncia";

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route element={<IndexPage />} path="/" />
      <Route element={<MetricsFullPage />} path="/mapa" />
      <Route element={<AboutPage />} path="/sobre-nosotros" />
      <Route element={<ComoFuncionaPage />} path="/como-funciona" />
      <Route element={<PrivacidadPage />} path="/privacidad" />
      <Route element={<TerminosPage />} path="/terminos" />
      <Route element={<ContactoPage />} path="/contacto" />
      <Route element={<ComunidadesPage />} path="/comunidades" />
      <Route element={<AliadosPage />} path="/aliados" />
      <Route element={<TutorialPage />} path="/tutorial" />
      <Route element={<AyudaPage />} path="/ayuda" />
      <Route element={<SoportePage />} path="/soporte" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<VerificarIdentidadPage />} path="/verificar-identidad" />

      {/* ===== RUTAS DE DENUNCIAS - TODAS PROTEGIDAS ===== */}
      {/* Listado de denuncias */}
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <DenunciasPage />
          </ProtectedRoute>
        }
        path="/denuncias"
      />
      
      {/* Detalle de denuncia - DEBE IR DESPUÉS DE /denuncias */}
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <DenunciaDetallePage />
          </ProtectedRoute>
        }
        path="/denuncias/:id"
      />

      {/* Rutas de creación de denuncia */}
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <DenunciarPage />
          </ProtectedRoute>
        }
        path="/denunciar"
      />
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <PhotoPage />
          </ProtectedRoute>
        }
        path="/denunciar/foto"
      />
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <VideoPage />
          </ProtectedRoute>
        }
        path="/denunciar/video"
      />
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <RecorderPage />
          </ProtectedRoute>
        }
        path="/denunciar/audio"
      />
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <SubirPage />
          </ProtectedRoute>
        }
        path="/denunciar/subir"
      />
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <CrearDenunciaPage />
          </ProtectedRoute>
        }
        path="/denunciar/crear"
      />

      {/* Página de éxito */}
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <DenunciaExitosaPage />
          </ProtectedRoute>
        }
        path="/denunciar/denuncia-exitosa"
      />

      {/* Perfil - también protegido */}
      <Route
        element={
          <ProtectedRoute requireVerification={true}>
            <PerfilPage />
          </ProtectedRoute>
        }
        path="/perfil"
      />
    </Routes>
  );
}

export default App;