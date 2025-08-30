//const BASE_URL = 'https://prod.suretopup.com.ng/api/v1';
const BASE_URL = 'https://test.eyzmo.com/api/v1'

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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

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
}

export const apiService = new ApiService();
export default apiService;
