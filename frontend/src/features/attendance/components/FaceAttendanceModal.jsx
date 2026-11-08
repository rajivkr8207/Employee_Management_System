import { useEffect, useRef, useState } from "react";
import { Camera, ScanFace } from "lucide-react";
import Modal from "../../../components/ui/Modal";

const captureFrame = (video) =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (image) => (image ? resolve(image) : reject(new Error("Could not capture a camera image."))),
      "image/jpeg",
      0.9,
    );
  });

export default function FaceAttendanceModal({
  action,
  loading,
  error,
  onClose,
  onVerified,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureRef = useRef(null);
  const busyRef = useRef(false);
  const [cameraError, setCameraError] = useState("");
  const [status, setStatus] = useState("Starting camera...");
  const [canRetry, setCanRetry] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    let active = true;
    let captureTimer;
    const video = videoRef.current;

    const verifyFrame = async () => {
      if (!active || busyRef.current || !videoRef.current?.videoWidth) return;
      busyRef.current = true;
      setCanRetry(false);
      setStatus("Capturing face for secure verification...");
      try {
        const image = await captureFrame(videoRef.current);
        const success = await onVerified(image);
        if (!active) return;
        if (success) {
          onClose();
          return;
        }
        setStatus("Face could not be verified. Adjust the camera and try again.");
        setCanRetry(true);
      } catch (verificationError) {
        if (active) {
          setCameraError(verificationError.message || "Unable to capture a camera image.");
          setCanRetry(true);
        }
      } finally {
        busyRef.current = false;
      }
    };

    captureRef.current = verifyFrame;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not available in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setHasCamera(true);
        video.addEventListener("loadeddata", handleVideoReady, { once: true });
        video.srcObject = stream;
        setStatus("Center one face in the frame.");
        if (video.readyState >= 2) handleVideoReady();
      } catch (cameraAccessError) {
        if (active) setCameraError(cameraAccessError.message || "Unable to access the camera.");
      }
    };

    startCamera();
    return () => {
      active = false;
      window.clearTimeout(captureTimer);
      video.removeEventListener("loadeddata", handleVideoReady);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      captureRef.current = null;
    };

    function handleVideoReady() {
      captureTimer = window.setTimeout(verifyFrame, 500);
    }
  }, [onClose, onVerified]);

  const isEnrollment = action === "enroll";
  const actionTitle = isEnrollment ? "face enrollment" : action;

  return (
    <Modal isOpen onClose={onClose} title={`Face ${actionTitle}`} size="md">
      <div className="space-y-4">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-950">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label="Live camera preview for face verification"
          />
          <div className="pointer-events-none absolute inset-[15%] rounded-[45%] border-2 border-white/70" />
          {!cameraError && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/60 px-3 py-2 text-sm text-white">
              <ScanFace size={18} />
              <span>{loading ? "Verifying with the local face model..." : status}</span>
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center text-white">
              <Camera size={28} />
              <p className="text-sm">{cameraError}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          {isEnrollment
            ? "Your face template and avatar are saved to your account. The face template is private and used for attendance matching."
            : "Face matching runs on this application server. Attendance photos are processed for verification and are not uploaded or saved."}
        </p>
        {(error || cameraError) && (
          <p role="alert" className="text-sm text-rose-600">{error || cameraError}</p>
        )}
        {canRetry && !cameraError && (
          <button
            type="button"
            onClick={() => captureRef.current?.()}
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            Try face verification again
          </button>
        )}
        {cameraError && hasCamera && (
          <button
            type="button"
            onClick={() => {
              setCameraError("");
              setStatus("Rechecking camera...");
              captureRef.current?.();
            }}
            disabled={loading}
            className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-60"
          >
            Try again
          </button>
        )}
      </div>
    </Modal>
  );
}
