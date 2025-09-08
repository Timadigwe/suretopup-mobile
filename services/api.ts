//const BASE_URL = 'https://prod.suretopup.com.ng/api/v1';
export const BASE_URL = 'https://test.eyzmo.com/api/v1'

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  tpin: string;
  state: string;
  password: string;
  password_confirmation: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  status?: string;
  message: string;
  data?: T;
  isTokenExpired?: boolean;
}

export interface AuthResponse {
  user: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    state: string;
  };
  token: string;
}

export interface DashboardUser {
  id: number;
  fullname: string;
  balance: string;
  email: string;
  email_verified: boolean;
}

export interface Transaction {
  id: number;
  type: string;
  amount: string;
  status: string;
  description: string;
  created_at: string;
}

export interface DashboardData {
  transactions: Transaction[];
  user: DashboardUser;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenExpired: (() => void) | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  setTokenExpiredCallback(callback: () => void) {
    this.onTokenExpired = callback;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { isFormData?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const defaultHeaders: Record<string, string> = {
        'Accept': 'application/json',
      };

      // Only add Content-Type for JSON requests
      if (!options.isFormData) {
        defaultHeaders['Content-Type'] = 'application/json';
      }

      // Add authorization header if token exists
      if (this.token) {
        defaultHeaders['Authorization'] = `Bearer ${this.token}`;
      }

      const config: RequestInit = {
        method: options.method || 'GET',
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      // Debug logging
      console.log('API Request:', {
        url,
        method: config.method,
        headers: config.headers,
        body: config.body
      });

      const response = await fetch(url, config);
      const data = await response.json();

      console.log('API Response:', { url, status: response.status, data });

      // Check for token expiration (only when we have a token and specific token-related errors)
      if (this.token && response.status === 401 && 
          data.message && (data.message.toLowerCase().includes('token has expired') ||
           data.message.toLowerCase().includes('token expired'))) {
        console.log('Token expiration detected:', { status: response.status, message: data.message });
        if (this.onTokenExpired) {
          this.onTokenExpired();
        }
        return {
          success: false,
          message: 'Token expired',
          isTokenExpired: true
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest<DashboardData>('/user/dashboard', {
      method: 'GET',
    });
  }

  async initializeDeposit(email: string, amount: number): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>> {
    return this.makeRequest<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('/user/deposit/initalize-deposit', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount,
      }),
    });
  }

  async checkPaymentStatus(reference: string): Promise<ApiResponse<{
    transaction: {
      userid: number;
      service: string;
      type: string;
      amount: number;
      ref: string;
      date: string;
      status: string;
      info: string;
      updated_at: string;
      created_at: string;
      id: number;
    };
    user: {
      id: number;
      fullname: string;
      email: string;
      new_balance: number;
    };
  }>> {
    return this.makeRequest<{
      transaction: {
        userid: number;
        service: string;
        type: string;
        amount: number;
        ref: string;
        date: string;
        status: string;
        info: string;
        updated_at: string;
        created_at: string;
        id: number;
      };
      user: {
        id: number;
        fullname: string;
        email: string;
        new_balance: number;
      };
    }>(`/user/deposit/payment-callback?trxref=${reference}&reference=${reference}`, {
      method: 'GET',
    });
  }

  async buyAirtime(data: {
    network: string;
    amount: number;
    phone: string;
    tpin: string;
  }): Promise<ApiResponse<{
    reference: string;
    amount: number;
    phone: string;
    network: string;
    transaction_id: number;
    new_balance: number;
    ebills: {
      status: string;
      data: {
        code: string;
        message: string;
        data: {
          order_id: number;
          status: string;
          product_name: string;
          service_name: string;
          phone: string;
          amount: number;
          discount: string;
          amount_charged: string;
          initial_balance: string;
          final_balance: string;
          request_id: string;
        };
      };
    };
    date: string;
  }>> {
    console.log('buyAirtime called with data:', data);
    return this.makeRequest<{
      reference: string;
      amount: number;
      phone: string;
      network: string;
      transaction_id: number;
      new_balance: number;
      ebills: {
        status: string;
        data: {
          code: string;
          message: string;
          data: {
            order_id: number;
            status: string;
            product_name: string;
            service_name: string;
            phone: string;
            amount: number;
            discount: string;
            amount_charged: string;
            initial_balance: string;
            final_balance: string;
            request_id: string;
          };
        };
      };
      date: string;
    }>('/user/buy-airtime', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Data Purchase
  async getDataPlans(): Promise<ApiResponse<{
    dataplans: Array<{
      id: number;
      variation_id: string;
      service_name: string;
      service_id: string;
      data_plan: string;
      price: string;
      percentage_charge: string;
      payment_price: string;
      availability: string;
      created_at: string;
      updated_at: string;
    }>;
  }>> {
    return this.makeRequest<{
      dataplans: Array<{
        id: number;
        variation_id: string;
        service_name: string;
        service_id: string;
        data_plan: string;
        price: string;
        percentage_charge: string;
        payment_price: string;
        availability: string;
        created_at: string;
        updated_at: string;
      }>;
    }>('/user/data-plan', {
      method: 'GET',
    });
  }

  async buyData(data: {
    network: string;
    dataplan: string;
    amount: number;
    phone: string;
    tpin: string;
  }): Promise<ApiResponse<{
    reference: string;
    amount: number;
    phone: string;
    service: string;
    date: string;
    transaction: {
      userid: number;
      service: string;
      type: string;
      amount: number;
      ref: string;
      date: string;
      status: string;
      info: string;
      updated_at: string;
      created_at: string;
      id: number;
    };
  }>> {
    return this.makeRequest<{
      reference: string;
      amount: number;
      phone: string;
      service: string;
      date: string;
      transaction: {
        userid: number;
        service: string;
        type: string;
        amount: number;
        ref: string;
        date: string;
        status: string;
        info: string;
        updated_at: string;
        created_at: string;
        id: number;
      };
    }>('/user/buy-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Card Printing (Recharge Pins)
  async buyRechargePins(data: {
    businessname: string;
    network: string;
    amount: string;
    quantity: string;
    amountp: string;
    tpin: string;
  }): Promise<ApiResponse<{
    reference: string;
    business_name: string;
    request_id: string;
    product_name: string;
    service_name: string;
    value: number;
    quantity: number;
    amount: number;
    initial_balance: number;
    final_balance: number;
    epins: Array<{
      amount: string;
      pin: string;
      serial: string;
      instruction: string;
    }>;
    transaction: {
      userid: number;
      service: string;
      type: string;
      amount: string;
      ref: string;
      date: string;
      status: string;
      updated_at: string;
      created_at: string;
      id: number;
    };
  }>> {
    return this.makeRequest<{
      reference: string;
      business_name: string;
      request_id: string;
      product_name: string;
      service_name: string;
      value: number;
      quantity: number;
      amount: number;
      initial_balance: number;
      final_balance: number;
      epins: Array<{
        amount: string;
        pin: string;
        serial: string;
        instruction: string;
      }>;
      transaction: {
        userid: number;
        service: string;
        type: string;
        amount: string;
        ref: string;
        date: string;
        status: string;
        updated_at: string;
        created_at: string;
        id: number;
      };
    }>('/user/buy-recharge-pins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Betting Companies
  async getBettingCompanies(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
  }>>> {
    return this.makeRequest<Array<{
      id: string;
      name: string;
    }>>('/user/betting-companies', {
      method: 'GET',
    });
  }

  // Verify Betting Customer
  async verifyBettingCustomer(data: {
    customer_id: string;
    service_id: string;
  }): Promise<ApiResponse<{
    customer_username: string;
    customer_name: string;
    customer_id: string;
    service_id: string;
    raw_response: {
      code: string;
      message: string;
      data: {
        service_name: string;
        customer_id: string;
        customer_name: string;
        customer_username: string;
        customer_email_address: string;
        customer_phone_number: string;
        minimum_amount: number;
        maximum_amount: number;
      };
    };
  }>> {
    return this.makeRequest<{
      customer_username: string;
      customer_name: string;
      customer_id: string;
      service_id: string;
      raw_response: {
        code: string;
        message: string;
        data: {
          service_name: string;
          customer_id: string;
          customer_name: string;
          customer_username: string;
          customer_email_address: string;
          customer_phone_number: string;
          minimum_amount: number;
          maximum_amount: number;
        };
      };
    }>('/user/verify-bet-customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Fund Betting Account
  async fundBettingAccount(data: {
    service_id: string;
    customer_id: string;
    amount: number;
    tpin: string;
  }): Promise<ApiResponse<{
    transaction: {
      userid: number;
      service: string;
      type: string;
      amount: number;
      ref: string;
      date: string;
      status: string;
      info: string;
      old_balance: number;
      new_balance: number;
      updated_at: string;
      created_at: string;
      id: number;
    };
    ebills_response: {
      code: string;
      message: string;
      data: {
        order_id: number;
        status: string;
        product_name: string;
        service_name: string;
        customer_id: string;
        customer_name: string;
        customer_username: string;
        customer_email_address: string;
        customer_phone_number: string;
        amount: number;
        amount_charged: string;
        discount: string;
        initial_balance: string;
        final_balance: string;
        request_id: string;
      };
    };
    receipt_data: {
      service: string;
      phone: string | null;
      reference: string;
      date: string;
      amount: number;
      rinfo: number;
    };
  }>> {
    return this.makeRequest<{
      transaction: {
        userid: number;
        service: string;
        type: string;
        amount: number;
        ref: string;
        date: string;
        status: string;
        info: string;
        old_balance: number;
        new_balance: number;
        updated_at: string;
        created_at: string;
        id: number;
      };
      ebills_response: {
        code: string;
        message: string;
        data: {
          order_id: number;
          status: string;
          product_name: string;
          service_name: string;
          customer_id: string;
          customer_name: string;
          customer_username: string;
          customer_email_address: string;
          customer_phone_number: string;
          amount: number;
          amount_charged: string;
          discount: string;
          initial_balance: string;
          final_balance: string;
          request_id: string;
        };
      };
      receipt_data: {
        service: string;
        phone: string | null;
        reference: string;
        date: string;
        amount: number;
        rinfo: number;
      };
    }>('/user/fund-account', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Electricity Bills
  async getPowerCompanies(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    covers: string;
  }>>> {
    return this.makeRequest<Array<{
      id: string;
      name: string;
      covers: string;
    }>>('/user/power-companies', {
      method: 'GET',
    });
  }

  async verifyElectricityCustomer(data: {
    customer_id: string;
    service_id: string;
    variation_id: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/verify-electricity-customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async purchaseElectricity(data: {
    customer_id: string;
    service_id: string;
    variation_id: string;
    amount: number;
    tpin: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/purchase-electricity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cable TV API methods
  async getCableCompanies(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
  }>>> {
    return this.makeRequest<Array<{
      id: string;
      name: string;
    }>>('/user/cable-companies', {
      method: 'GET',
    });
  }

  // NIN API methods
  async getNinSlipTypes(): Promise<ApiResponse<{
    slip_types: Array<{
      id: number;
      type: string;
      name: string;
      price: number;
      status: string;
      created_at: string;
      updated_at: string;
    }>;
  }>> {
    return this.makeRequest<{
      slip_types: Array<{
        id: number;
        type: string;
        name: string;
        price: number;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
    }>('/user/slip-type', {
      method: 'GET',
    });
  }

  async submitNinRequest(data: {
    slip_type: string;
    nin_number: string;
    amount: string;
  }): Promise<ApiResponse<{
    nin_id: number;
    transaction: {
      userid: number;
      service: string;
      type: string;
      amount: number;
      ref: string;
      date: string;
      status: string;
      info: string;
      old_balance: number;
      new_balance: number;
      updated_at: string;
      created_at: string;
      id: number;
    };
  }>> {
    return this.makeRequest<{
      nin_id: number;
      transaction: {
        userid: number;
        service: string;
        type: string;
        amount: number;
        ref: string;
        date: string;
        status: string;
        info: string;
        old_balance: number;
        new_balance: number;
        updated_at: string;
        created_at: string;
        id: number;
      };
    }>('/user/nin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // CAC API methods
  async getCacPrice(): Promise<{
    success: boolean;
    cac_price: string;
  }> {
    const response = await this.makeRequest<{
      success: boolean;
      cac_price: string;
    }>('/user/cac-price', {
      method: 'GET',
    });
    // The API returns data directly, not wrapped in response.data
    return response as any;
  }

  async submitCacRequest(data: FormData): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/cac', {
      method: 'POST',
      body: data,
      isFormData: true,
    });
  }

  // Get single transaction details
  async getSingleTransaction(ref: string, service: string): Promise<ApiResponse<{
    id: number;
    userid: string;
    service: string;
    type: string;
    amount: string;
    ref: string;
    date: string;
    status: string;
    info: string | null;
    old_balance: string;
    new_balance: string;
    created_at: string;
    updated_at: string;
  }>> {
    return this.makeRequest(`/user/single-transaction?ref=${ref}&service=${encodeURIComponent(service)}`, {
      method: 'GET',
    });
  }

  // Profile API methods
  async getUserProfile(): Promise<ApiResponse<{
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    verification_code: string | null;
    email_verified_at: string | null;
    tpin: string;
    phone: string;
    balance: string;
    state: string;
    ipaddress: string | null;
    device: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>> {
    return this.makeRequest('/user/profile', {
      method: 'GET',
    });
  }

  async updateProfile(data: {
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    state: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/update-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePin(data: {
    current_pin: string;
    new_pin: string;
    new_pin_confirmation: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/change-pin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCableVariations(): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/cable-variations', {
      method: 'GET',
    });
  }

  async verifyCableCustomer(data: {
    customer_id: string;
    service_id: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/verify-cable-customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async subscribeCable(data: {
    variation_id: string;
    service_id: string;
    customer_id: string;
    subscription_type: string;
    amount: number;
    tpin: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/subscribe-cable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
