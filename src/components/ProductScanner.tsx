import { useState, useRef, useEffect, useCallback } from "react";
import { AlertTriangle, Info, ListChecks, Lock, Milk, ScanLine, Sparkles, Sun, Upload, ZoomIn } from "lucide-react";

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
type Stage = "idle" | "camera" | "preview" | "analyzing" | "result" | "error";

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
  // De onde veio a foto atual: define se "tirar outra" abre a câmera ou a galeria
  const [source, setSource] = useState<"camera" | "gallery">("camera");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPermissionDenied(false);
      setStage("camera");
      // Se o <video> já está montado (ex: flip de câmera), anexa imediatamente.
      // Caso contrário, o useEffect abaixo cuida disso após a renderização.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") setPermissionDenied(true);
      console.error(err);
    }
  }, [facingMode]);

  // Anexa o stream ao <video> quando ele monta pela primeira vez (stage "idle" → "camera")
  useEffect(() => {
    if (stage === "camera" && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [stage]);

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
    setSource("camera");
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
      if (!N8N_WEBHOOK_URL) throw new Error("Webhook de análise não configurado");
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("image", blob, "produto.jpg");

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro na análise");
      const data = await response.json();
      // Só exibe resultado se a resposta tiver o veredito; nunca inventa um resultado
      if (typeof data?.safe !== "boolean") throw new Error("Resposta inválida da análise");
      setResult(data as ScanResult);
      setStage("result");
    } catch (err) {
      console.error("Erro ao analisar produto:", err);
      setResult(null);
      setStage("error");
    }
  }, [capturedImage]);

  /** Foto escolhida da galeria (útil no computador, sem câmera traseira) */
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Escolha um arquivo de imagem (JPG ou PNG).");
      setStage("idle");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("A imagem é muito grande. Escolha uma foto de até 10 MB.");
      setStage("idle");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadError(null);
      setCapturedImage(reader.result as string);
      setSource("gallery");
      setStage("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  /** Nova foto pelo mesmo caminho usado antes (câmera ou galeria) */
  const retake = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    if (source === "gallery") {
      setStage("idle");
      fileInputRef.current?.click();
    } else {
      startCamera();
    }
  }, [source, startCamera]);

  const reset = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setResult(null);
    setPermissionDenied(false);
    setUploadError(null);
    setStage("idle");
  }, [stopCamera]);

  useEffect(() => () => { stopCamera(); cancelAnimationFrame(animRef.current); }, [stopCamera]);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-hidden tabIndex={-1} />

      {/* ── IDLE ── */}
      {stage === "idle" && (
        <div className="w-full grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 items-start">
          {/* Ação principal */}
          <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card p-6 md:p-8 bg-[radial-gradient(110%_90%_at_0%_0%,hsl(var(--primary)/0.16)_0%,transparent_55%),radial-gradient(80%_80%_at_100%_100%,hsl(40_95%_70%/0.14)_0%,transparent_60%)] shadow-[0_1px_2px_hsl(var(--primary)/0.08),0_16px_40px_-20px_hsl(var(--primary)/0.45)]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(152_70%_62%)] to-[hsl(165_55%_40%)] text-white flex items-center justify-center shadow-[0_10px_24px_-10px_hsl(160_50%_30%/0.7)]">
              <ScanLine className="w-8 h-8" />
            </div>
            <h3 className="mt-5 text-xl md:text-2xl font-extrabold tracking-[-0.02em] text-foreground">Fotografe o rótulo</h3>
            <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
              Nossa IA lê a lista de ingredientes e os avisos de alergênicos e mostra se o produto tem proteína do leite
              de vaca ou outros alérgenos do seu perfil.
            </p>

            <ul className="mt-5 flex flex-wrap gap-2" aria-label="O que é verificado">
              {[
                { icon: Milk, label: "Leite e derivados" },
                { icon: AlertTriangle, label: "Avisos de traços" },
                { icon: ListChecks, label: "Outros alérgenos" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-card/80 border border-border/70 px-3 py-1.5 text-[13px] font-semibold text-foreground/80">
                  <Icon className="w-3.5 h-3.5 text-[hsl(152_55%_32%)] dark:text-primary" /> {label}
                </li>
              ))}
            </ul>

            {(permissionDenied || uploadError) && (
              <div role="alert" className="mt-5 rounded-xl border border-caution/40 bg-caution/10 px-4 py-3 text-sm text-caution-foreground leading-relaxed">
                {uploadError ??
                  "O acesso à câmera foi negado. Libere a câmera nas configurações do navegador ou envie uma foto da galeria."}
              </div>
            )}

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <button onClick={() => startCamera()} className="btn-primary h-12 py-0 flex items-center justify-center gap-2">
                <CameraIcon /> Abrir câmera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-12 rounded-xl border-2 border-border bg-card text-[15px] font-bold text-foreground inline-flex items-center justify-center gap-2 hover:border-primary/60 hover:bg-secondary active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Upload className="w-[18px] h-[18px]" /> Enviar foto
              </button>
            </div>

            <p className="mt-5 flex gap-2 text-[13px] text-muted-foreground leading-relaxed">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                A foto vai para o nosso serviço de análise por IA só para ler os ingredientes. Evite fotografar pessoas ou
                documentos.{" "}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                  Saiba mais
                </a>
              </span>
            </p>
          </section>

          {/* Como funciona + dicas */}
          <aside className="space-y-4">
            <section className="rounded-3xl bg-card border border-border/60 p-6 shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_10px_28px_-14px_hsl(160_40%_15%/0.18)]">
              <h3 className="text-base font-extrabold text-foreground">Como funciona</h3>
              <ol className="mt-4 space-y-4">
                {[
                  { t: "Fotografe os ingredientes", d: "Enquadre só a lista de ingredientes e os avisos de alergênicos." },
                  { t: "Confira a foto", d: "As letras precisam estar nítidas e legíveis." },
                  { t: "Veja o resultado", d: "Seguro ou com alérgenos, com a lista do que foi encontrado." },
                ].map((step, i) => (
                  <li key={step.t} className="flex gap-3">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary/20 text-[13px] font-extrabold text-foreground flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold text-foreground leading-snug">{step.t}</span>
                      <span className="block text-sm text-muted-foreground leading-relaxed">{step.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-3xl bg-secondary/60 border border-border/60 p-6">
              <h3 className="text-base font-extrabold text-foreground">Dicas para uma boa leitura</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-foreground/80">
                {[
                  { icon: Sun, t: "Use um lugar bem iluminado." },
                  { icon: Sparkles, t: "Evite reflexos na embalagem." },
                  { icon: ZoomIn, t: "Aproxime até as letras ficarem nítidas." },
                ].map(({ icon: Icon, t }) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" /> {t}
                  </li>
                ))}
              </ul>
            </section>

            <p className="flex gap-2 rounded-2xl border border-caution/30 bg-caution/10 px-4 py-3 text-[13px] text-caution-foreground leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              A análise é automática e pode errar. Sempre confira o rótulo e, na dúvida, fale com o médico ou nutricionista.
            </p>
          </aside>
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
            <button onClick={reset} aria-label="Fechar câmera"
              className="w-12 h-12 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/25 active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <CloseIcon />
            </button>
            <button onClick={capturePhoto} aria-label="Tirar foto"
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center border-4 border-white/50 text-foreground active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.3)" }}>
              <ShutterIcon />
            </button>
            <button onClick={flipCamera} aria-label="Trocar câmera"
              className="w-12 h-12 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/25 active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
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
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 bg-transparent text-muted-foreground border border-border rounded-2xl py-3 text-sm font-medium hover:border-primary/50 hover:text-foreground active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {source === "gallery" ? "Escolher outra" : "Tirar outra"}
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

      {/* ── ERROR ── */}
      {stage === "error" && (
        <div className="card-soft w-full max-w-sm p-6 flex flex-col gap-5" role="alert">
          <div className="rounded-2xl border border-caution/40 bg-caution/10 p-6 flex flex-col items-center gap-3 text-center">
            <span className="text-caution">
              <AlertIcon />
            </span>
            <h3 className="text-lg font-bold tracking-tight text-caution-foreground">
              Não foi possível analisar
            </h3>
            <p className="text-sm text-caution-foreground/90 leading-relaxed">
              A análise do rótulo falhou e <strong>nenhum resultado foi gerado</strong>. Não considere este produto
              seguro nem inseguro com base nesta tentativa. Tente novamente ou confira os ingredientes no rótulo.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 bg-transparent text-muted-foreground border border-border rounded-2xl py-3 text-sm font-medium hover:border-primary/50 active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Cancelar
            </button>
            <button
              onClick={analyzeImage}
              disabled={!capturedImage}
              className="flex-1 btn-primary flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              <RetryIcon /> Tentar novamente
            </button>
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
              onClick={retake}
              className="flex-1 flex items-center justify-center gap-2 bg-transparent text-muted-foreground border border-border rounded-2xl py-3 text-sm font-medium hover:border-primary/50 hover:text-foreground active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
