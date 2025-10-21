import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

export interface CardPrintingReceiptData {
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
  // Card printing specific fields
  business_name?: string;
  quantity?: number;
  epins?: Array<{
    amount: string;
    pin: string;
    serial: string;
    instruction: string;
  }>;
  // Transaction history metadata
  metadata?: string;
}

export const generateCardPrintingHTML = (receiptData: CardPrintingReceiptData) => {
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

  // Get ePINs from metadata or direct field
  const getEpinsData = (): Array<{
    amount: string;
    pin: string;
    serial: string;
    instruction: string;
  }> => {
    if (receiptData.metadata) {
      try {
        const metadata = JSON.parse(receiptData.metadata);
        return metadata.epins || [];
      } catch (error) {
        console.error('Error parsing metadata:', error);
        return [];
      }
    }
    return receiptData.epins || [];
  };

  const epinsData = getEpinsData();
  
  // Calculate dynamic height based on number of ePINs
  const baseHeight = 600;
  const additionalHeight = epinsData.length * 80; // 80px per ePIN card
  const dynamicHeight = Math.max(baseHeight, baseHeight + additionalHeight);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Card Printing Receipt ${receiptData.reference}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            padding: 20px;
          }
          .receipt-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            min-height: ${dynamicHeight}px;
          }
          .receipt-header {
            margin-bottom: 24px;
          }
          .logo-container {
            width: 200px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }
          .logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .success-icon-container {
            text-align: center;
            margin-bottom: 24px;
          }
          .network-icon-container {
            width: 40px;
            height: 40px;
            border-radius: 32px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .network-icon {
            width: 100%;
            height: 100%;
            border-radius: 20px;
            object-fit: cover;
          }
          .amount-value {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
          }
          .amount-label {
            font-size: 20px;
            color: #666;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 14px;
            font-weight: 400;
            color: #333;
          }
          .dotted-line {
            width: 100%;
            height: 1px;
            border-style: dashed;
            border-width: 1px;
            border-color: #E5E5E5;
            margin: 16px 0;
          }
          .receipt-details {
            margin-bottom: 12px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #E5E5E5;
            border-style: dotted;
          }
          .detail-label {
            font-size: 14px;
            font-weight: 500;
            color: #666;
            flex: 1;
          }
          .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            flex: 1;
            text-align: right;
          }
          .epins-section {
            margin-top: 16px;
          }
          .epins-title {
            font-size: 16px;
            font-weight: bold;
            color: #00A651;
            margin-bottom: 12px;
            text-align: center;
          }
          .epin-card {
            background: #FDF6E3;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid #E5E5E5;
            box-shadow: 0 1px 2px rgba(0,0,0,0.08);
            min-height: 80px;
            position: relative;
          }
          .epin-card-number {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #00A651;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            z-index: 2;
          }
          .epin-header {
            margin-bottom: 6px;
          }
          .epin-network-info {
            display: flex;
            align-items: center;
          }
          .epin-network-icon-container {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
          }
          .epin-network-icon {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            object-fit: cover;
          }
          .epin-network-text {
            flex: 1;
          }
          .epin-network-name {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 2px;
          }
          .epin-business-name {
            font-size: 14px;
            color: #666;
          }
          .epin-details {
            margin-top: 4px;
          }
          .epin-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .epin-label {
            font-size: 14px;
            font-weight: 500;
            color: #666;
            flex: 1;
          }
          .epin-value {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            flex: 2;
            text-align: right;
            word-break: break-all;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 32px;
          }
          .footer-text {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
          }
          .footer-subtext {
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="receipt-header">
            <div class="logo-container">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDBBOTAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdXJlVG9wVXA8L3RleHQ+Cjwvc3ZnPgo=" alt="SureTopUp Logo" class="logo" />
            </div>
          </div>

          <!-- Success Section -->
          <div class="success-icon-container">
            <div class="network-icon-container">
              <div style="width: 100%; height: 100%; background: #f0f0f0; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px;">📱</div>
            </div>
            <div class="amount-value">${formatAmount(receiptData.amount)}</div>
            <div class="amount-label">Successful Transaction</div>
            <div class="detail-value">${formatDate(receiptData.date)}</div>
          </div>

          <!-- Dotted Line -->
          <div class="dotted-line"></div>

          <!-- Receipt Details -->
          <div class="receipt-details">
            <div class="detail-row">
              <span class="detail-label">Reference</span>
              <span class="detail-value">${receiptData.reference}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Network</span>
              <span class="detail-value">${receiptData.network?.toUpperCase() || 'N/A'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Amount</span>
              <span class="detail-value">${formatAmount(receiptData.amount)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(receiptData.date)}</span>
            </div>
            
            ${receiptData.oldBalance && receiptData.newBalance ? `
            <div class="detail-row">
              <span class="detail-label">Previous Balance</span>
              <span class="detail-value">${formatAmount(parseFloat(receiptData.oldBalance))}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">New Balance</span>
              <span class="detail-value">${formatAmount(parseFloat(receiptData.newBalance))}</span>
            </div>
            ` : ''}
          </div>

          <!-- ePINs Section -->
          ${epinsData.length > 0 ? `
          <div class="epins-section">
            <div class="dotted-line"></div>
            <div class="epins-title">Your ePIN(s)</div>
            
            ${epinsData.map((epin, index) => `
              <div class="epin-card">
                <div class="epin-card-number">Card ${index + 1}</div>
                
                <div class="epin-header">
                  <div class="epin-network-info">
                    <div class="epin-network-icon-container">
                      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px;">📱</div>
                    </div>
                    <div class="epin-network-text">
                      <div class="epin-network-name">${receiptData.business_name || receiptData.businessName || 'SureTopUp'}</div>
                      <div class="epin-business-name">${receiptData.network?.toUpperCase() || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <div class="epin-details">
                  <div class="epin-row">
                    <span class="epin-label">PIN:</span>
                    <span class="epin-value">${epin.pin}</span>
                  </div>
                  <div class="epin-row">
                    <span class="epin-label">Amount:</span>
                    <span class="epin-value">${formatAmount(parseFloat(epin.amount))}</span>
                  </div>
                  <div class="epin-row">
                    <span class="epin-label">Serial:</span>
                    <span class="epin-value">${epin.serial}</span>
                  </div>
                  ${epin.instruction ? `
                  <div class="epin-row" style="background: white; padding: 4px; border-radius: 10px;">
                    <span class="epin-label">Instruction:</span>
                    <span class="epin-value">${epin.instruction}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="receipt-footer">
            <div class="dotted-line"></div>
            <div class="footer-text">Thank you for using SureTopUp</div>
            <div class="footer-subtext">For support, contact us @info@suretopup.com.ng</div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const shareCardPrintingReceiptAsPDF = async (
  receiptData: CardPrintingReceiptData, 
  viewShotRef: React.RefObject<ViewShot | null>
) => {
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
    
    // Get ePINs count for dynamic height calculation
    const getEpinsData = (): Array<{
      amount: string;
      pin: string;
      serial: string;
      instruction: string;
    }> => {
      if (receiptData.metadata) {
        try {
          const metadata = JSON.parse(receiptData.metadata);
          return metadata.epins || [];
        } catch (error) {
          console.error('Error parsing metadata:', error);
          return [];
        }
      }
      return receiptData.epins || [];
    };

    const epinsData = getEpinsData();
    
    // Calculate dynamic height based on ePIN count
    const baseHeight = 842; // A4 base height
    const additionalHeight = Math.max(0, (epinsData.length - 3) * 120); // Extra height for additional ePINs
    const dynamicHeight = Math.min(baseHeight + additionalHeight, 2000); // Cap at 2000 points
    
    // Create HTML with the base64 image to convert to PDF
    const htmlWithImage = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Card Printing Receipt - ${receiptData.reference}</title>
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
              overflow: hidden;
            }
            .receipt-container {
              width: 100%;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              page-break-after: avoid;
              page-break-before: avoid;
            }
            .receipt-image {
              max-width: 100%;
              max-height: 100vh;
              width: auto;
              height: auto;
              display: block;
              object-fit: contain;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
            @page {
              margin: 0;
              padding: 0;
              size: A4;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .receipt-container {
                height: 100vh;
                overflow: hidden;
              }
              .receipt-image {
                max-height: 100vh;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <img src="data:image/png;base64,${base64Image}" alt="Card Printing Receipt" class="receipt-image" />
          </div>
        </body>
      </html>
    `;
    
    // Generate PDF from the image with dynamic height for multiple ePINs
    const { uri } = await Print.printToFileAsync({
      html: htmlWithImage,
      base64: false,
      width: 595, // A4 width in points
      height: dynamicHeight, // Dynamic height based on ePIN count
    });
    
    // Create a new file with the desired name including service type
    const serviceName = receiptData.service || 'CardPrinting';
    const fileName = `SureTopUp-${serviceName}-${receiptData.reference}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Copy the generated PDF to the new location with proper name
    await FileSystem.copyAsync({
      from: uri,
      to: newUri,
    });
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Use expo-sharing for proper PDF file sharing on both platforms
    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: fileName,
      UTI: 'com.adobe.pdf',
    });
    
    return { success: true, uri: newUri };
  } catch (error) {
    console.error('Error sharing card printing receipt as PDF:', error);
    throw error;
  }
};
