'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScanFace, Terminal, Loader2, RefreshCw } from 'lucide-react'

export default function ScannerPage() {
  const [retraining, setRetraining] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRetrain = async () => {
    setRetraining(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ml/retrain', { method: 'POST' })
      const data = await res.json()
      setMessage(res.ok ? data.message || 'Retrain started' : data.error || 'Failed')
    } catch {
      setMessage('Could not reach backend. Is the API running on port 8000?')
    } finally {
      setRetraining(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Face Scanner</h1>
        <p className="text-muted-foreground">
          Run the gate scanner on a machine with a webcam. Students cannot mark attendance from the website.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Start gate scanner
          </CardTitle>
          <CardDescription>
            Use the same Python environment that has insightface installed (project venv).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
{`cd attendance-system/edge_face_recognition
source ../backend/.venv/bin/activate
pip install insightface onnxruntime opencv-python joblib scikit-learn

python generate_embeddings.py
python train_Ann_model.py
python hostel_live_recognition.py`}
          </pre>
          <p className="text-sm text-muted-foreground">
            Press <strong>Q</strong> in the camera window to quit. One attendance per student per <strong>24 hours</strong>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Retrain model
          </CardTitle>
          <CardDescription>
            After new student registrations, rebuild embeddings and the ANN (also runs automatically on signup).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleRetrain} disabled={retraining}>
            {retraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
            Retrain now
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
