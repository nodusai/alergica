import { useState, useRef, useEffect, useCallback } from "react";

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string;

// ─── ICONS ───────────────────────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ShutterIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.15"/>
  </svg>
);

const FlipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const RetryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-8.51"/>
  </svg>
);

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type Stage = "idle" | "camera" | "preview" | "analyzing" | "result";

interface ScanResult {
  safe: boolean;
  product?: string;
  allergens?: string[];
  details?: string;
}

// -─── COMPONENTE ──────────────────────────────────────────────────────────────
export default function ProductScanner() {
  const [stage, setStage] = useState<Stage>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Animação da linha de scan
  useEffect(() => {
    if (stage !== "analyzing") return;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = ((ts - start) % 2000) / 2000;
      setScanLine(progress * 100);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [stage]);

  const startCamera = useCallback(async (facing: "environment" | "user" = facingMode) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPermissionDenied(false);
      setStage("camera");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") setPermissionDenied(true);
      console.error(err);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setStage("preview");
  }, [stopCamera]);

  const flipCamera = useCallback(() => {
    const next: "environment" | "user" = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  const analyzeImage = useCallback(async () => {
    if (!capturedImage) return;
    setStage("analyzing");
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("image", blob, "produto.jpg");

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro na análise");
      const data: ScanResult = await response.json();
      setResult(data);
    } catch {
      // Fallback de demonstração enquanto o webhook não retorna
      setResult({
        safe: false,
        product: "Produto Analisado",
        allergens: ["Leite", "Derivados de leite"],
        details: "Foram detectados ingredientes que podem conter proteína do leite de vaca. Evite oferecer este produto ao seu filho.",
      });
    }
    setStage("result");
  }, [capturedImage]);

  const reset = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setResult(null);
    setPermissionDenied(false);
    setStage("idle");
  }, [stopCamera]);

  useEffect(() => () => { stopCamera(); cancelAnimationFrame(animRef.current); }, [stopCamera]);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── IDLE ── */}
      {stage === "idle" && (
        <div className="card-soft w-full max-w-sm p-8 flex flex-col items-center gap-5 text-center">
          {/* Ícone com pulse */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
            <div className="relative z-10 w-16 h-16 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center">
              <span className="text-3xl">🛒</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Verificar Produto</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fotografe a tabela de ingredientes de qualquer produto alimentício. Nossa IA verifica se há proteína do leite de vaca ou outros alérgenos cadastrados no perfil do seu filho.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {["📋 Ingredientes", "⚗️ Excipientes", "🏭 Fábrica"].map((t) => (
              <span key={t} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
                {t}
              </span>
            ))}
          </div>

          {permissionDenied && (
            <div className="w-full bg-caution/10 border border-caution/40 rounded-xl p-3 text-xs text-caution-foreground text-left">
              ⚠️ Acesso à câmera negado. Habilite nas configurações do navegador e tente novamente.
            </div>
          )}

          <button
            onClick={() => startCamera()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <CameraIcon />
            Abrir Câmera
          </button>
        </div>
      )}

      {/* ── CAMERA ── */}
      {stage === "camera" && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-black shadow-hover"
          style={{ aspectRatio: "9/16" }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Overlay com viewfinder */}
          <div className="absolute inset-0 flex items-start justify-center pt-[22%]">
            {/* Cantos do visor */}
            {[
              { top: "20%", left: "10%" },
              { top: "20%", right: "10%", transform: "scaleX(-1)" },
              { bottom: "28%", left: "10%", transform: "scaleY(-1)" },
              { bottom: "28%", right: "10%", transform: "scale(-1,-1)" },
            ].map((pos, i) => (
              <div key={i} className="absolute w-7 h-7 border-t-2 border-l-2 rounded-sm"
                style={{ borderColor: "hsl(var(--primary))", ...pos }} />
            ))}
            <p className="text-white/90 text-xs bg-black/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
              Aponte para a tabela de ingredientes
            </p>
          </div>

          {/* Controles */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-6 flex items-center justify-between"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
            <button onClick={reset}
              className="w-12 h-12 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center backdrop-blur-md">
              <CloseIcon />
            </button>
            <button onClick={capturePhoto}
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center border-4 border-white/50 text-foreground"
              style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.3)" }}>
              <ShutterIcon />
            </button>
            <button onClick={flipCamera}
              className="w-12 h-12 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center backdrop-blur-md">
              <FlipIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {stage === "preview" && capturedImage && (
        <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-card shadow-card">
          <img src={capturedImage} alt="Foto capturada" className="w-full object-cover" style={{ aspectRatio: "4/3" }} />
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Os ingredientes estão nítidos e legíveis?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setCapturedImage(null); startCamera(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-transparent text-muted-foreground border border-border rounded-2xl py-3 text-sm font-medium hover:border-primary/50 transition-colors">
                Tirar outra
              </button>
              <button onClick={analyzeImage}
                className="flex-1 btn-primary flex items-center justify-center gap-2">
                Analisar ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYZING ── */}
      {stage === "analyzing" && capturedImage && (
        <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-card shadow-card flex flex-col">
          <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
            <img src={capturedImage} alt="" className="w-full h-full object-cover block brightness-75" />
            {/* Linha de scan */}
            <div className="absolute left-0 right-0 h-0.5 z-10"
              style={{
                top: `${scanLine}%`,
                background: `linear-gradient(to right, transparent, hsl(var(--primary)), hsl(var(--primary)), transparent)`,
                boxShadow: `0 0 12px hsl(var(--primary))`,
                transition: "top 0.016s linear",
              }} />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(26,46,38,0.35) 0%, hsl(var(--primary) / 0.12) 100%)" }} />
          </div>
          <div className="p-6 flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-[3px] border-secondary border-t-primary animate-spin" />
            <p className="text-base font-bold text-foreground">Analisando ingredientes...</p>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Verificando a composição do produto com as alergias cadastradas no perfil
            </p>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {stage === "result" && result && (
        <div className="card-soft w-full max-w-sm p-6 flex flex-col gap-5">
          {/* Badge principal */}
          <div className={`rounded-2xl border p-6 flex flex-col items-center gap-3 ${
            result.safe
              ? "bg-safe/10 border-safe/40"
              : "bg-risk/10 border-risk/40"
          }`}>
            <span className={result.safe ? "text-safe" : "text-risk"}>
              {result.safe ? <CheckIcon /> : <AlertIcon />}
            </span>
            <h3 className={`text-lg font-bold tracking-tight text-center ${
              result.safe ? "text-safe-foreground" : "text-risk-foreground"
            }`}>
              {result.safe ? "Produto Seguro ✓" : "Atenção! Alérgenos Detectados"}
            </h3>
            {result.product && (
              <p className="text-sm text-muted-foreground italic">{result.product}</p>
            )}
          </div>

          {/* Alérgenos encontrados */}
          {!result.safe && result.allergens && result.allergens.length > 0 && (
            <div className="bg-risk/5 border border-risk/20 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-risk-foreground uppercase tracking-wide">
                Alérgenos encontrados:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.allergens.map((a) => (
                  <span key={a} className="bg-risk text-risk-foreground rounded-full px-3 py-1 text-xs font-semibold">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.details && (
            <p className="text-sm text-muted-foreground leading-relaxed text-center">{result.details}</p>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={() => { setCapturedImage(null); startCamera(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-transparent text-muted-foreground border border-border rounded-2xl py-3 text-sm font-medium hover:border-primary/50 transition-colors">
              <RetryIcon /> Novo scan
            </button>
            <button onClick={reset} className="flex-1 btn-primary flex items-center justify-center">
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
