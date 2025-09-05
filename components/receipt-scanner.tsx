"use client"

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReceiptLineItem, IngredientCanonical } from '@/lib/types';
import { DataService } from '@/lib/data-service';

interface ReceiptScannerProps {
  onReceiptProcessed: (lineItems: ReceiptLineItem[]) => void;
}

export function ReceiptScanner({ onReceiptProcessed }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedItems, setProcessedItems] = useState<ReceiptLineItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock OCR processing - in a real app, this would call an OCR service
  const processImageWithOCR = async (imageDataUrl: string): Promise<ReceiptLineItem[]> => {
    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock OCR results - in reality, this would come from the OCR service
    const mockOCRResults = [
      {
        text: "CHICKEN BREAST 2.5 LB",
        confidence: 0.95,
        boundingBox: { x: 10, y: 20, width: 200, height: 30 }
      },
      {
        text: "BELL PEPPERS 4 UNITS",
        confidence: 0.92,
        boundingBox: { x: 10, y: 60, width: 200, height: 30 }
      },
      {
        text: "RICE WHITE 2 CUPS",
        confidence: 0.88,
        boundingBox: { x: 10, y: 100, width: 200, height: 30 }
      },
      {
        text: "OLIVE OIL 500ML",
        confidence: 0.94,
        boundingBox: { x: 10, y: 140, width: 200, height: 30 }
      },
      {
        text: "TOMATOES 6 UNITS",
        confidence: 0.90,
        boundingBox: { x: 10, y: 180, width: 200, height: 30 }
      },
      {
        text: "ONIONS 3 UNITS",
        confidence: 0.87,
        boundingBox: { x: 10, y: 220, width: 200, height: 30 }
      }
    ];

    // Parse OCR results into line items
    const lineItems: ReceiptLineItem[] = mockOCRResults.map((result, index) => {
      const parsed = parseReceiptLine(result.text);
      // In a real app, this would use the DataService to find ingredients
      // For now, we'll use a simple lookup
      return {
        id: `line-${index}`,
        receiptId: 'mock-receipt',
        rawText: result.text,
        nameCanonicalId: undefined, // Will be matched later
        quantity: parsed.quantity,
        unit: parsed.unit,
        sizeText: parsed.sizeText,
        confidence: {
          name: result.confidence,
          quantity: result.confidence * 0.9,
          unit: result.confidence * 0.85
        },
        parsedName: parsed.name,
        parsedQuantity: parsed.quantity,
        parsedUnit: parsed.unit
      };
    });

    return lineItems;
  };

  // Parse receipt line text to extract name, quantity, and unit
  const parseReceiptLine = (text: string): { name: string; quantity: number; unit: string; sizeText?: string } => {
    // Simple parsing logic - in a real app, this would use NLP
    const words = text.split(' ');
    let name = '';
    let quantity = 1;
    let unit = 'unit';
    let sizeText = '';

    // Look for quantity patterns
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toUpperCase();
      
      // Check for quantity
      if (/^\d+(\.\d+)?$/.test(word)) {
        quantity = parseFloat(word);
        continue;
      }
      
      // Check for units
      if (['LB', 'LBS', 'KG', 'G', 'ML', 'L', 'CUP', 'CUPS', 'UNIT', 'UNITS'].includes(word)) {
        unit = word.toLowerCase();
        if (unit === 'lbs') unit = 'lb';
        if (unit === 'units') unit = 'unit';
        continue;
      }
      
      // Check for size indicators
      if (['SMALL', 'MEDIUM', 'LARGE', 'XL'].includes(word)) {
        sizeText = word;
        continue;
      }
      
      // Everything else is part of the name
      if (name) name += ' ';
      name += words[i];
    }

    return { name: name.trim(), quantity, unit, sizeText };
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
        setIsScanning(false);
      }
    }
  };

  const processReceipt = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const lineItems = await processImageWithOCR(capturedImage);
      setProcessedItems(lineItems);
      setShowReview(true);
    } catch (err) {
      setError('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setCapturedImage(null);
    setProcessedItems([]);
    setShowReview(false);
    
    try {
      await startCamera();
    } catch (err) {
      setError('Failed to start camera');
      setIsScanning(false);
    }
  };

  const handleConfirmItems = () => {
    onReceiptProcessed(processedItems);
    setShowReview(false);
    setCapturedImage(null);
    setProcessedItems([]);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setProcessedItems([]);
    setShowReview(false);
    setError(null);
  };

  const updateLineItem = (id: string, updates: Partial<ReceiptLineItem>) => {
    setProcessedItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  if (showReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Review Imported Items
          </CardTitle>
          <CardDescription>
            Review and edit the items detected from your receipt before adding to pantry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {processedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.parsedName}</span>
                    <Badge variant={item.nameCanonicalId ? "default" : "secondary"}>
                      {item.nameCanonicalId ? "Matched" : "Unmatched"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.parsedQuantity} {item.parsedUnit}
                    {item.sizeText && ` • ${item.sizeText}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(item.confidence.name * 100)}%
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // In a real app, this would open an edit modal
                    console.log('Edit item:', item);
                  }}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRetake} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Retake Photo
            </Button>
            <Button onClick={handleConfirmItems} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Confirm & Import
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (capturedImage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Receipt Captured
          </CardTitle>
          <CardDescription>
            Review the captured image and process it to extract items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured receipt" 
              className="w-full rounded-lg border"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRetake}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={processReceipt} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process Receipt
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="h-5 w-5" />
          Receipt Scanner
        </CardTitle>
        <CardDescription>
          Scan your grocery receipts to automatically add ingredients to your pantry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isScanning && !videoRef.current?.srcObject ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Starting camera...</p>
          </div>
        ) : isScanning && videoRef.current?.srcObject ? (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border"
              />
              <div className="absolute inset-0 border-2 border-primary border-dashed rounded-lg m-2 pointer-events-none">
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                  Position receipt here
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsScanning(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={captureImage} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isScanning ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <Camera
              className={`h-16 w-16 mx-auto mb-4 ${
                isScanning ? "text-primary animate-pulse" : "text-muted-foreground"
              }`}
            />
            <p className="text-muted-foreground mb-4">
              {isScanning ? "Scanning receipt..." : "Position your receipt within the frame"}
            </p>
            <Button size="lg" className="w-full max-w-xs" onClick={handleScan} disabled={isScanning}>
              <Camera className="h-4 w-4 mr-2" />
              {isScanning ? "Scanning..." : "Start Scanning"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">92% Accuracy</p>
                <p className="text-xs text-muted-foreground">OCR Recognition</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Auto-Sort</p>
                <p className="text-xs text-muted-foreground">Smart Categories</p>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  );
}
