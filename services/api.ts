export const BASE_URL = 'https://prod.suretopup.com.ng/api/v1';
//export const BASE_URL = 'https://test.eyzmo.com/api/v1'

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

      // Debug logging (development only)
      if (__DEV__) {
        console.log('API Request:', {
          url,
          method: config.method,
          headers: config.headers,
          body: config.body,
        });
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (__DEV__) {
        console.log('API Response:', { url, status: response.status, data });
      }

      // Check for token expiration/invalid token (only when we have a token and specific auth errors)
      const message: string | undefined = data?.message;
      if (
        this.token &&
        response.status === 401 &&
        typeof message === 'string'
      ) {
        const msg = message.toLowerCase();
        const isAuthError =
          msg.includes('token has expired') ||
          msg.includes('token expired') ||
          msg.includes('unauthenticated') ||
          msg.includes('token is invalid') ||
          msg.includes('logged out due to inactivity') ||
          msg.includes('unauthorized');

        if (isAuthError) {
          if (__DEV__) {
            console.log('Token auth error detected:', {
              status: response.status,
              message,
            });
          }
          if (this.onTokenExpired) {
            this.onTokenExpired();
          }
          return {
            success: false,
            message: 'Token expired',
            isTokenExpired: true,
          };
        }
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

  // Admin login
  async adminLogin(credentials: { username: string; password: string }): Promise<ApiResponse<{
    token: string;
    token_type: string;
    admin: {
      id: number;
      username: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    expires_in: number;
  }>> {
    return this.makeRequest<{
      token: string;
      token_type: string;
      admin: {
        id: number;
        username: string;
        status: string;
        created_at: string;
        updated_at: string;
      };
      expires_in: number;
    }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Admin logout
  async adminLogout(): Promise<ApiResponse> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // Admin dashboard
  async getAdminDashboard(): Promise<ApiResponse<{
    users: number;
    transactions: number;
    referral: number;
    ebills_wallet_balance: string;
    total_users_balance: string;
    total_transaction_amount: string;
    total_credited_amount: string;
    total_debited_amount: string;
    total_credited_amount_today: number;
    total_debited_amount_today: number;
    total_nin: number;
    total_cac: number;
  }>> {
    return this.makeRequest<{
      users: number;
      transactions: number;
      referral: number;
      ebills_wallet_balance: string;
      total_users_balance: string;
      total_transaction_amount: string;
      total_credited_amount: string;
      total_debited_amount: string;
      total_credited_amount_today: number;
      total_debited_amount_today: number;
      total_nin: number;
      total_cac: number;
    }>('/admin/dashboard', {
      method: 'GET',
    });
  }

  // Admin users
  async getAdminUsers(): Promise<ApiResponse<{
    users: Array<{
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
      referral_count: number;
    }>;
    total_users: number;
  }>> {
    return this.makeRequest<{
      users: Array<{
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
        referral_count: number;
      }>;
      total_users: number;
    }>('/admin/users', {
      method: 'GET',
    });
  }

  // Admin credit/debit user
  async creditDebitUser(data: {
    email: string;
    action: 'Credit' | 'Debit';
    amount: number;
  }): Promise<ApiResponse<{
    user: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
    };
    transaction: {
      action: string;
      amount: number;
      old_balance: string;
      new_balance: number;
      balance_change: number;
    };
    timestamp: string;
  }>> {
    return this.makeRequest<{
      user: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
      };
      transaction: {
        action: string;
        amount: number;
        old_balance: string;
        new_balance: number;
        balance_change: number;
      };
      timestamp: string;
    }>('/admin/credit-debit-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin ban user
  async banUser(data: {
    id?: number;
    email?: string;
  }): Promise<ApiResponse<{
    user_id: number;
    email: string;
  }>> {
    return this.makeRequest<{
      user_id: number;
      email: string;
    }>('/admin/users/ban', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin unban user
  async unbanUser(data: {
    id?: number;
    email?: string;
  }): Promise<ApiResponse<{
    user_id: number;
    email: string;
  }>> {
    return this.makeRequest<{
      user_id: number;
      email: string;
    }>('/admin/users/unban', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin delete user
  async deleteUser(data: {
    id?: number;
    email?: string;
  }): Promise<ApiResponse<{
    user_id: number;
    email: string;
  }>> {
    return this.makeRequest<{
      user_id: number;
      email: string;
    }>('/admin/users/delete', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Admin send email to single user
  async sendEmailToUser(data: {
    user_id: number;
    subject: string;
    message: string;
  }): Promise<ApiResponse<{
    user: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
    };
    email_details: {
      subject: string;
      message_length: number;
      sent_at: string;
    };
  }>> {
    return this.makeRequest<{
      user: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
      };
      email_details: {
        subject: string;
        message_length: number;
        sent_at: string;
      };
    }>('/admin/users/send-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin bulk email - send
  async sendBulkEmail(data: {
    subject: string;
    message: string;
  }): Promise<ApiResponse<{
    total_recipients: number;
    successful: number;
    failed: number;
    failed_emails: string[];
    subject: string;
    message_length: number;
    sent_at: string;
  }>> {
    return this.makeRequest<{
      total_recipients: number;
      successful: number;
      failed: number;
      failed_emails: string[];
      subject: string;
      message_length: number;
      sent_at: string;
    }>('/admin/bulk-email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin bulk email - queue
  async queueBulkEmail(data: {
    subject: string;
    message: string;
    batch_size: number;
  }): Promise<ApiResponse<{
    total_recipients: number;
    batch_id: string;
    batch_name: string;
    queue_name: string;
    queued_at: string;
    batch_status: string;
  }>> {
    return this.makeRequest<{
      total_recipients: number;
      batch_id: string;
      batch_name: string;
      queue_name: string;
      queued_at: string;
      batch_status: string;
    }>('/admin/bulk-email/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin bulk email stats
  async getBulkEmailStats(): Promise<ApiResponse<{
    total_users: number;
    users_with_email: number;
    verified_users: number;
    unverified_users: number;
    eligible_recipients: number;
    stats_generated_at: string;
  }>> {
    return this.makeRequest<{
      total_users: number;
      users_with_email: number;
      verified_users: number;
      unverified_users: number;
      eligible_recipients: number;
      stats_generated_at: string;
    }>('/admin/bulk-email/stats', {
      method: 'GET',
    });
  }

  // Admin data variation - get all
  async getDataVariations(): Promise<ApiResponse<{
    services: Array<{
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
    total_services: number;
  }>> {
    return this.makeRequest<{
      services: Array<{
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
      total_services: number;
    }>('/admin/data-variation', {
      method: 'GET',
    });
  }

  // Admin data variation - get single
  async getSingleDataVariation(id: number): Promise<ApiResponse<{
    service: {
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
    };
  }>> {
    return this.makeRequest<{
      service: {
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
      };
    }>(`/admin/data-variation/single-data-variation?id=${id}`, {
      method: 'GET',
    });
  }

  // Admin data variation - update single
  async updateDataVariation(id: number, percentage_charge: number): Promise<ApiResponse<{
    service: {
      id: number;
      service_name: string;
      base_price: number;
      old_percentage_charge: string;
      new_percentage_charge: number;
      old_payment_price: string;
      new_payment_price: number;
      price_difference: number;
    };
    calculations: {
      base_price: number;
      percentage_charge: string;
      charge_amount: number;
      final_price: number;
    };
    updated_at: string;
  }>> {
    return this.makeRequest<{
      service: {
        id: number;
        service_name: string;
        base_price: number;
        old_percentage_charge: string;
        new_percentage_charge: number;
        old_payment_price: string;
        new_payment_price: number;
        price_difference: number;
      };
      calculations: {
        base_price: number;
        percentage_charge: string;
        charge_amount: number;
        final_price: number;
      };
      updated_at: string;
    }>(`/admin/data-variation/update-data-variation?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ percentage_charge }),
    });
  }

  // Admin data variation - get by provider
  async getDataVariationsByProvider(provider: string): Promise<ApiResponse<{
    provider: string;
    services: Array<{
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
    count: number;
  }>> {
    return this.makeRequest<{
      provider: string;
      services: Array<{
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
      count: number;
    }>(`/admin/data-variation/data-variation-provider?provider=${encodeURIComponent(provider)}`, {
      method: 'GET',
    });
  }

  // Admin data variation - bulk update
  async bulkUpdateDataVariations(data: {
    percentage_charge: number;
    service_ids: number[];
  }): Promise<ApiResponse<{
    percentage_charge_applied: number;
    total_services_targeted: number;
    successfully_updated: number;
    failed_updates: any[];
    failed_count: number;
  }>> {
    return this.makeRequest<{
      percentage_charge_applied: number;
      total_services_targeted: number;
      successfully_updated: number;
      failed_updates: any[];
      failed_count: number;
    }>('/admin/data-variation/data-variation-bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin cable variation - get all
  async getAdminCableVariations(): Promise<ApiResponse<{
    services: Array<{
      id: number;
      variation_id: string;
      service_name: string;
      service_id: string;
      package_bouquet: string;
      price: string;
      percentage_charge: string;
      payment_price: string;
      availability: string;
      created_at: string;
      updated_at: string;
    }>;
    total_services: number;
  }>> {
    return this.makeRequest<{
      services: Array<{
        id: number;
        variation_id: string;
        service_name: string;
        service_id: string;
        package_bouquet: string;
        price: string;
        percentage_charge: string;
        payment_price: string;
        availability: string;
        created_at: string;
        updated_at: string;
      }>;
      total_services: number;
    }>('/admin/cable-variation', {
      method: 'GET',
    });
  }

  // Admin cable variation - get single
  async getSingleCableVariation(id: number): Promise<ApiResponse<{
    service: {
      id: number;
      variation_id: string;
      service_name: string;
      service_id: string;
      package_bouquet: string;
      price: string;
      percentage_charge: string;
      payment_price: string;
      availability: string;
      created_at: string;
      updated_at: string;
    };
  }>> {
    return this.makeRequest<{
      service: {
        id: number;
        variation_id: string;
        service_name: string;
        service_id: string;
        package_bouquet: string;
        price: string;
        percentage_charge: string;
        payment_price: string;
        availability: string;
        created_at: string;
        updated_at: string;
      };
    }>(`/admin/cable-variation/single-cable-variation?id=${id}`, {
      method: 'GET',
    });
  }

  // Admin cable variation - update single
  async updateCableVariation(id: number, percentage_charge: number): Promise<ApiResponse<{
    service: {
      id: number;
      service_name: string;
      base_price: number;
      old_percentage_charge: string;
      new_percentage_charge: number;
      old_payment_price: string;
      new_payment_price: number;
      price_difference: number;
    };
    calculations: {
      base_price: number;
      percentage_charge: string;
      charge_amount: number;
      final_price: number;
    };
    updated_at: string;
  }>> {
    return this.makeRequest<{
      service: {
        id: number;
        service_name: string;
        base_price: number;
        old_percentage_charge: string;
        new_percentage_charge: number;
        old_payment_price: string;
        new_payment_price: number;
        price_difference: number;
      };
      calculations: {
        base_price: number;
        percentage_charge: string;
        charge_amount: number;
        final_price: number;
      };
      updated_at: string;
    }>(`/admin/cable-variation/update-cable-variation?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ percentage_charge }),
    });
  }

  // Admin cable variation - get by provider
  async getCableVariationsByProvider(provider: string): Promise<ApiResponse<{
    provider: string;
    services: Array<{
      id: number;
      variation_id: string;
      service_name: string;
      service_id: string;
      package_bouquet: string;
      price: string;
      percentage_charge: string;
      payment_price: string;
      availability: string;
      created_at: string;
      updated_at: string;
    }>;
    count: number;
  }>> {
    return this.makeRequest<{
      provider: string;
      services: Array<{
        id: number;
        variation_id: string;
        service_name: string;
        service_id: string;
        package_bouquet: string;
        price: string;
        percentage_charge: string;
        payment_price: string;
        availability: string;
        created_at: string;
        updated_at: string;
      }>;
      count: number;
    }>(`/admin/cable-variation/cable-variation-provider?provider=${encodeURIComponent(provider)}`, {
      method: 'GET',
    });
  }

  // Admin cable variation - bulk update
  async bulkUpdateCableVariations(data: {
    percentage_charge: number;
    service_ids: number[];
  }): Promise<ApiResponse<{
    percentage_charge_applied: number;
    total_services_targeted: number;
    successfully_updated: number;
    failed_updates: any[];
    failed_count: number;
  }>> {
    return this.makeRequest<{
      percentage_charge_applied: number;
      total_services_targeted: number;
      successfully_updated: number;
      failed_updates: any[];
      failed_count: number;
    }>('/admin/cable-variation/cable-variation-bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin transactions - get all
  async getAdminTransactions(params?: {
    page?: number;
    per_page?: number;
    type?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    user_id?: number;
  }): Promise<ApiResponse<{
    transactions: Array<{
      id: number;
      user_id: string;
      user_email: string;
      user_firstname: string;
      user_lastname: string;
      type: string;
      amount: number;
      description: string | null;
      reference: string | null;
      status: string;
      service: string;
      previous_balance: number | null;
      new_balance: number;
      created_at: string;
      updated_at: string;
      formatted_amount: string;
      formatted_previous_balance: string | null;
      formatted_new_balance: string;
    }>;
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
    filters: {
      type: string | null;
      status: string | null;
      search: string | null;
      sort_by: string;
      sort_order: string;
    };
    summary: {
      total_transactions: number;
      credit_transactions: number;
      debit_transactions: number;
      successful_transactions: number;
      failed_transactions: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/transactions?${queryString}` : '/admin/transactions';

    return this.makeRequest<{
      transactions: Array<{
        id: number;
        user_id: string;
        user_email: string;
        user_firstname: string;
        user_lastname: string;
        type: string;
        amount: number;
        description: string | null;
        reference: string | null;
        status: string;
        service: string;
        previous_balance: number | null;
        new_balance: number;
        created_at: string;
        updated_at: string;
        formatted_amount: string;
        formatted_previous_balance: string | null;
        formatted_new_balance: string;
      }>;
      pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
      };
      filters: {
        type: string | null;
        status: string | null;
        search: string | null;
        sort_by: string;
        sort_order: string;
      };
      summary: {
        total_transactions: number;
        credit_transactions: number;
        debit_transactions: number;
        successful_transactions: number;
        failed_transactions: number;
      };
    }>(endpoint, {
      method: 'GET',
    });
  }

  // Admin slip types - get all
  async getAdminSlipTypes(): Promise<ApiResponse<{
    slip_types: Array<{
      id: number;
      type: string;
      name: string;
      price: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>;
    total_slips: number;
    active_slips: number;
    inactive_slips: number;
  }>> {
    return this.makeRequest<{
      slip_types: Array<{
        id: number;
        type: string;
        name: string;
        price: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
      total_slips: number;
      active_slips: number;
      inactive_slips: number;
    }>('/admin/slip-types', {
      method: 'GET',
    });
  }

  // Admin slip types - get single
  async getSingleSlipType(id: number): Promise<ApiResponse<{
    slip_type: {
      id: number;
      type: string;
      name: string;
      price: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    formatted_price: string;
  }>> {
    return this.makeRequest<{
      slip_type: {
        id: number;
        type: string;
        name: string;
        price: string;
        status: string;
        created_at: string;
        updated_at: string;
      };
      formatted_price: string;
    }>(`/admin/slip-types/${id}`, {
      method: 'GET',
    });
  }

  // Admin slip types - create
  async createSlipType(data: {
    name: string;
    price: number;
    status: string;
  }): Promise<ApiResponse<{
    slip_type: {
      id: number;
      type: string;
      name: string;
      price: number;
      status: string;
      created_at: string;
      updated_at: string;
    };
    action: string;
    formatted_price: string;
  }>> {
    return this.makeRequest<{
      slip_type: {
        id: number;
        type: string;
        name: string;
        price: number;
        status: string;
        created_at: string;
        updated_at: string;
      };
      action: string;
      formatted_price: string;
    }>('/admin/slip-types/create-slip-type', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin slip types - update
  async updateSlipType(id: number, data: {
    name: string;
    price: number;
    status: string;
  }): Promise<ApiResponse<{
    slip_type: {
      id: number;
      type: string;
      name: string;
      price: number;
      status: string;
      created_at: string;
      updated_at: string;
    };
    changes: {
      name: { old: string; new: string };
      type: { old: string; new: string };
      price: { old: string; new: number };
      status: { old: string; new: string };
    };
    formatted_price: string;
  }>> {
    return this.makeRequest<{
      slip_type: {
        id: number;
        type: string;
        name: string;
        price: number;
        status: string;
        created_at: string;
        updated_at: string;
      };
      changes: {
        name: { old: string; new: string };
        type: { old: string; new: string };
        price: { old: string; new: number };
        status: { old: string; new: string };
      };
      formatted_price: string;
    }>(`/admin/slip-types/update-slip-type/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin slip types - delete
  async deleteSlipType(id: number): Promise<ApiResponse<{
    deleted_slip: {
      id: number;
      type: string;
      name: string;
      price: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    formatted_price: string;
    deleted_at: string;
  }>> {
    return this.makeRequest<{
      deleted_slip: {
        id: number;
      type: string;
        name: string;
        price: string;
        status: string;
        created_at: string;
        updated_at: string;
      };
      formatted_price: string;
      deleted_at: string;
    }>(`/admin/slip-types/delete-slip-type/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin other services - get all
  async getAdminOtherServices(): Promise<ApiResponse<{
    pending_requests: {
      nin: Array<{
        id: string;
        userid: string;
        slip_type: string;
        nin_number: string;
        amount: string;
        status: string;
      }>;
      cac: Array<{
        id: string;
        userid: string;
        certificate_type: string;
        business_name_1: string;
        business_name_2: string;
        company_address: string;
        residential_address: string;
        nature_of_business: string;
        share_capital: string;
        id_card_of_directors: string;
        passport_photograph: string;
        phone: string;
        email: string;
        fullname: string;
        dob: string;
        country: string;
        state: string;
        lga: string;
        city: string;
        sign: string;
        status: string;
      }>;
      total_pending: number;
    };
  }>> {
    return this.makeRequest<{
      pending_requests: {
        nin: Array<{
          id: string;
          userid: string;
          slip_type: string;
          nin_number: string;
          amount: string;
          status: string;
        }>;
        cac: Array<{
          id: string;
          userid: string;
          certificate_type: string;
          business_name_1: string;
          business_name_2: string;
          company_address: string;
          residential_address: string;
          nature_of_business: string;
          share_capital: string;
          id_card_of_directors: string;
          passport_photograph: string;
          phone: string;
          email: string;
          fullname: string;
          dob: string;
          country: string;
          state: string;
          lga: string;
          city: string;
          sign: string;
          status: string;
        }>;
        total_pending: number;
      };
    }>('/admin/other-services', {
      method: 'GET',
    });
  }

  // Admin NIN submissions - get all
  async getAdminNinSubmissions(): Promise<ApiResponse<{
    submissions: Array<{
      id: number;
      userid: string;
      slip_type: string;
      nin_number: string;
      amount: string;
      status: string;
      user: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        phone: string;
        balance: string;
        state: string;
        status: string;
        is_banned: boolean;
      };
    }>;
    total: number;
  }>> {
    return this.makeRequest<{
      submissions: Array<{
        id: number;
        userid: string;
        slip_type: string;
        nin_number: string;
        amount: string;
        status: string;
        user: {
          id: number;
          firstname: string;
          lastname: string;
          email: string;
          phone: string;
          balance: string;
          state: string;
          status: string;
          is_banned: boolean;
        };
      }>;
      total: number;
    }>('/admin/nins', {
      method: 'GET',
    });
  }

  // Admin NIN submission - get single
  async getAdminNinSubmission(id: number): Promise<ApiResponse<{
    id: number;
    userid: string;
    slip_type: string;
    nin_number: string;
    amount: string;
    status: string;
    user: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
      phone: string;
      balance: string;
      state: string;
      status: string;
      is_banned: boolean;
    };
  }>> {
    return this.makeRequest<{
      id: number;
      userid: string;
      slip_type: string;
      nin_number: string;
      amount: string;
      status: string;
      user: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        phone: string;
        balance: string;
        state: string;
        status: string;
        is_banned: boolean;
      };
    }>(`/admin/nins/${id}`, {
      method: 'GET',
    });
  }

  // Admin NIN submission - delete
  async deleteAdminNinSubmission(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/admin/nins/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin CAC submissions - get all
  async getAdminCacSubmissions(): Promise<ApiResponse<{
    submissions: Array<{
      id: number;
      userid: string;
      certificate_type: string;
      business_name_1: string;
      business_name_2: string;
      company_address: string;
      residential_address: string;
      nature_of_business: string;
      share_capital: string;
      id_card_of_directors: string;
      passport_photograph: string;
      phone: string;
      email: string;
      fullname: string;
      dob: string;
      country: string;
      state: string;
      lga: string;
      city: string;
      sign: string;
      status: string;
      user: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        phone: string;
        balance: string;
        state: string;
        status: string;
        is_banned: boolean;
      };
    }>;
    total: number;
  }>> {
    return this.makeRequest<{
      submissions: Array<{
        id: number;
        userid: string;
        certificate_type: string;
        business_name_1: string;
        business_name_2: string;
        company_address: string;
        residential_address: string;
        nature_of_business: string;
        share_capital: string;
        id_card_of_directors: string;
        passport_photograph: string;
        phone: string;
        email: string;
        fullname: string;
        dob: string;
        country: string;
        state: string;
        lga: string;
        city: string;
        sign: string;
        status: string;
        user: {
          id: number;
          firstname: string;
          lastname: string;
          email: string;
          phone: string;
          balance: string;
          state: string;
          status: string;
          is_banned: boolean;
        };
      }>;
      total: number;
    }>('/admin/cacs', {
      method: 'GET',
    });
  }

  // Admin CAC submission - get single
  async getAdminCacSubmission(id: number): Promise<ApiResponse<{
    id: number;
    userid: string;
    certificate_type: string;
    business_name_1: string;
    business_name_2: string;
    company_address: string;
    residential_address: string;
    nature_of_business: string;
    share_capital: string;
    id_card_of_directors: string;
    passport_photograph: string;
    phone: string;
    email: string;
    fullname: string;
    dob: string;
    country: string;
    state: string;
    lga: string;
    city: string;
    sign: string;
    status: string;
    user: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
      phone: string;
      balance: string;
      state: string;
      status: string;
      is_banned: boolean;
    };
  }>> {
    return this.makeRequest<{
      id: number;
      userid: string;
      certificate_type: string;
      business_name_1: string;
      business_name_2: string;
      company_address: string;
      residential_address: string;
      nature_of_business: string;
      share_capital: string;
      id_card_of_directors: string;
      passport_photograph: string;
      phone: string;
      email: string;
      fullname: string;
      dob: string;
      country: string;
      state: string;
      lga: string;
      city: string;
      sign: string;
      status: string;
      user: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        phone: string;
        balance: string;
        state: string;
        status: string;
        is_banned: boolean;
      };
    }>(`/admin/cacs/${id}`, {
      method: 'GET',
    });
  }

  // Admin CAC submission - delete
  async deleteAdminCacSubmission(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/admin/cacs/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin other services - update status
  async updateOtherServiceStatus(data: {
    table: 'nin' | 'cac';
    id: number;
    status: 'pending' | 'completed' | 'rejected' | 'processing';
  }): Promise<ApiResponse<{
    table: string;
    id: number;
    old_status: string;
    new_status: string;
    updated_at: string;
  }>> {
    return this.makeRequest<{
      table: string;
      id: number;
      old_status: string;
      new_status: string;
      updated_at: string;
    }>('/admin/other-services/update-status', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin other services - delete record
  async deleteOtherServiceRecord(data: {
    table: 'nin' | 'cac';
    id: number;
  }): Promise<ApiResponse<{
    table: string;
    id: number;
    deleted_record: any;
    deleted_at: string;
  }>> {
    return this.makeRequest<{
      table: string;
      id: number;
      deleted_record: any;
      deleted_at: string;
    }>('/admin/other-services/delete-record', {
      method: 'DELETE',
      body: JSON.stringify(data),
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

  async calculateCharge(amount: number): Promise<ApiResponse<{
    amount: number;
    percentage: number;
    percentage_charge: number;
    flat_fee: number;
    service_charge: number;
    total_to_pay: number;
  }>> {
    return this.makeRequest<{
      amount: number;
      percentage: number;
      percentage_charge: number;
      flat_fee: number;
      service_charge: number;
      total_to_pay: number;
    }>('/user/deposit/calculate-charge', {
      method: 'POST',
      body: JSON.stringify({
        amount,
      }),
    });
  }

  async initializeDeposit(
    email: string, 
    amount: number, 
    chargeData?: {
      percentage: number;
      percentage_charge: number;
      flat_fee: number;
      service_charge: number;
      total_to_pay: number;
    }
  ): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>> {
    const requestBody: any = {
      email,
      amount,
    };

    // Add charge calculation fields if provided
    if (chargeData) {
      requestBody.percentage = chargeData.percentage;
      requestBody.percentage_charge = chargeData.percentage_charge;
      requestBody.flat_fee = chargeData.flat_fee;
      requestBody.service_charge = chargeData.service_charge;
      requestBody.total_to_pay = chargeData.total_to_pay;
    }

    return this.makeRequest<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('/user/deposit/initalize-deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
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
    if (__DEV__) {
      console.log('buyAirtime called with data:', data);
    }

    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

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
    // Refresh eBills token before purchase
    await this.ensureTokenRefresh();

    return this.makeRequest('/user/subscribe-cable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculateCardDiscount(data: {
    network: string;
    amount: number;
    quantity: number;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/printcard/calculate-discount', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // eBills Token Refresh
  async refreshEbillsToken(): Promise<ApiResponse<{
    message: string;
  }>> {
    try {
      const response = await fetch('http://prod.suretopup.com.ng/refresh-ebill-token', {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, application/json',
        },
      });
      
      // Check if response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the response as text first
      const responseText = await response.text();
      if (__DEV__) {
        console.log('eBills token refresh response (raw):', responseText);
      }
      
      // Check if the response contains the success message
      if (responseText.includes('✅') && responseText.includes('eBills token refreshed successfully')) {
        return {
          success: true,
          status: 'success',
          message: 'eBills token refreshed successfully',
          data: { message: responseText.trim() },
        };
      } else {
        // Try to parse as JSON if it's not the expected text format
        try {
          const data = JSON.parse(responseText);
          return {
            success: true,
            status: 'success',
            message: data.message || 'eBills token refreshed successfully',
            data: data,
          };
        } catch (jsonError) {
          // If it's not JSON either, treat any response as success
          return {
            success: true,
            status: 'success',
            message: 'eBills token refreshed successfully',
            data: { message: responseText.trim() },
          };
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('eBills token refresh error:', error);
      }
      return {
        success: false,
        message: 'Failed to refresh eBills token',
      };
    }
  }

  // Helper method to refresh token before purchase
  private async ensureTokenRefresh(): Promise<boolean> {
    try {
      if (__DEV__) {
        console.log('Refreshing eBills token before purchase...');
      }
      const refreshResponse = await this.refreshEbillsToken();
      
      if (refreshResponse.success || refreshResponse.status === 'success') {
        if (__DEV__) {
          console.log('✅ eBills token refreshed successfully');
        }
        return true;
      } else {
        if (__DEV__) {
          console.log('⚠️ eBills token refresh failed, but continuing with purchase');
        }
        return false;
      }
    } catch (error) {
      if (__DEV__) {
        console.log('⚠️ eBills token refresh error, but continuing with purchase:', error);
      }
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
