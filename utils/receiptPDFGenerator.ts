import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

export interface ReceiptData {
  reference: string;
  amount: number;
  service: string;
  date: string;
  businessName?: string;
  phone?: string;
  network?: string;
  oldBalance?: string;
  newBalance?: string;
  info?: string;
  // Additional fields for specific receipt types
  [key: string]: any;
}

export const generateReceiptHTML = (receiptData: ReceiptData, receiptType: string = 'Receipt') => {
  const formatAmount = (amount: number) => `₦${amount.toLocaleString()}`;
  
  const formatDate = (dateString: string) => {
    try {
      let date: Date;
      
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('th') || dateString.includes('st') || dateString.includes('nd') || dateString.includes('rd')) {
        const cleanDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
        date = new Date(cleanDate);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return dateString;
    }
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${receiptType} ${receiptData.reference}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #00A900, #008000);
            color: white;
            padding: 20px;
            text-align: center;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 10px;
            background: rgba(255,255,255,0.2);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          .company-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 20px;
          }
          .success-icon {
            text-align: center;
            margin-bottom: 20px;
          }
          .success-text {
            font-size: 18px;
            font-weight: bold;
            color: #00A900;
            text-align: center;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;
          }
          .detail-label {
            color: #666;
            font-weight: 500;
          }
          .detail-value {
            font-weight: 600;
            color: #333;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #00A900;
          }
          .footer {
            background: #f8f9fa;
            padding: 15px 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">📱</div>
            <div class="company-name">${receiptData.businessName || 'SureTopUp'}</div>
            <div class="receipt-title">${receiptType}</div>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            <div class="success-text">${receiptType} Successful!</div>
            
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">${receiptData.reference}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value amount">${formatAmount(receiptData.amount)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${receiptData.service}</span>
            </div>
            
            ${receiptData.phone ? `
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${receiptData.phone}</span>
            </div>
            ` : ''}
            
            ${receiptData.network ? `
            <div class="detail-row">
              <span class="detail-label">Network:</span>
              <span class="detail-value">${receiptData.network}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${formatDate(receiptData.date)}</span>
            </div>
            
            ${receiptData.oldBalance && receiptData.newBalance ? `
            <div class="detail-row">
              <span class="detail-label">Previous Balance:</span>
              <span class="detail-value">${formatAmount(parseFloat(receiptData.oldBalance))}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">New Balance:</span>
              <span class="detail-value">${formatAmount(parseFloat(receiptData.newBalance))}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for using ${receiptData.businessName || 'SureTopUp'}!</p>
            <p>Keep this receipt for your records.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const shareReceiptAsPDF = async (receiptData: ReceiptData, receiptType: string = 'Receipt', viewShotRef: React.RefObject<ViewShot | null>) => {
  try {
    // Capture the receipt as image using ViewShot
    const viewShot = viewShotRef.current;
    if (!viewShot || !viewShot.capture) {
      throw new Error('ViewShot not available');
    }

    const imageUri = await viewShot.capture();
    
    // Convert image to base64 for PDF compatibility
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Create HTML with the base64 image to convert to PDF
    const htmlWithImage = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${receiptType} - ${receiptData.reference}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              padding: 0;
              margin: 0;
            }
            .receipt-container {
              width: 100%;
              page-break-inside: avoid;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .receipt-image {
              max-width: 100%;
              height: auto;
              display: block;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
            @page {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <img src="data:image/png;base64,${base64Image}" alt="${receiptType}" class="receipt-image" />
          </div>
        </body>
      </html>
    `;
    
    // Generate PDF from the image with high quality settings
    const { uri } = await Print.printToFileAsync({
      html: htmlWithImage,
      base64: false,
      width: 595, // A4 width in points
      height: 842, // A4 height in points
    });
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Use expo-sharing for proper PDF file sharing on both platforms
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Transaction-Reference-${receiptData.reference}`,
    });
    
    return { success: true, uri };
  } catch (error) {
    console.error('Error sharing receipt as PDF:', error);
    throw error;
  }
};
