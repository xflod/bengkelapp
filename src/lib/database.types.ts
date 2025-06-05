
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          sku: string
          name: string
          category: string | null // Consider ENUM in PostgreSQL
          cost_price: number | null
          selling_prices: Json | null // JSONB for array of SellingPriceTier
          stock_quantity: number | null
          low_stock_threshold: number | null
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          supplier_id: string | null
          image_url: string | null
        }
        Insert: {
          id?: number
          sku: string
          name: string
          category?: string | null
          cost_price?: number | null
          selling_prices?: Json | null
          stock_quantity?: number | null
          low_stock_threshold?: number | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          supplier_id?: string | null
          image_url?: string | null
        }
        Update: {
          id?: number
          sku?: string
          name?: string
          category?: string | null
          cost_price?: number | null
          selling_prices?: Json | null
          stock_quantity?: number | null
          low_stock_threshold?: number | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          supplier_id?: string | null
          image_url?: string | null
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          id: number
          transaction_id_client: string | null
          date: string
          items: Json // JSONB for array of ReportSaleItem
          subtotal: number
          discount_applied: number | null
          final_amount: number
          total_cogs: number | null
          total_profit: number | null
          payment_method: string | null // Consider ENUM
          customer_name: string | null
          service_notes: string | null
          type: string
          created_at: string | null
        }
        Insert: {
          id?: number
          transaction_id_client?: string | null
          date: string
          items: Json
          subtotal: number
          discount_applied?: number | null
          final_amount: number
          total_cogs?: number | null
          total_profit?: number | null
          payment_method?: string | null
          customer_name?: string | null
          service_notes?: string | null
          type: string
          created_at?: string | null
        }
        Update: {
          id?: number
          transaction_id_client?: string | null
          date?: string
          items?: Json
          subtotal?: number
          discount_applied?: number | null
          final_amount?: number
          total_cogs?: number | null
          total_profit?: number | null
          payment_method?: string | null
          customer_name?: string | null
          service_notes?: string | null
          type?: string
          created_at?: string | null
        }
        Relationships: []
      }
      service_jobs: {
        Row: {
          id: number
          customer_name: string
          customer_phone: string | null
          vehicle_plate: string
          vehicle_type: string
          service_request: string
          actual_start_time: string | null
          work_done_notes: string | null
          status: string // Consider ENUM
          access_code: string
          created_at: string | null
          updated_at: string | null
          estimated_progress: number | null
        }
        Insert: {
          id?: number
          customer_name: string
          customer_phone?: string | null
          vehicle_plate: string
          vehicle_type: string
          service_request: string
          actual_start_time?: string | null
          work_done_notes?: string | null
          status: string
          access_code: string
          created_at?: string | null
          updated_at?: string | null
          estimated_progress?: number | null
        }
        Update: {
          id?: number
          customer_name?: string
          customer_phone?: string | null
          vehicle_plate?: string
          vehicle_type?: string
          service_request?: string
          actual_start_time?: string | null
          work_done_notes?: string | null
          status?: string
          access_code?: string
          created_at?: string | null
          updated_at?: string | null
          estimated_progress?: number | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: number
          name: string
          position: string | null
          join_date: string | null // DATE type
          phone: string | null
          address: string | null
          status: string | null // Consider ENUM
          payroll_frequency: string | null // Consider ENUM
          base_salary: number | null
          loan_notes: string | null
          performance_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          position?: string | null
          join_date?: string | null
          phone?: string | null
          address?: string | null
          status?: string | null
          payroll_frequency?: string | null
          base_salary?: number | null
          loan_notes?: string | null
          performance_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          position?: string | null
          join_date?: string | null
          phone?: string | null
          address?: string | null
          status?: string | null
          payroll_frequency?: string | null
          base_salary?: number | null
          loan_notes?: string | null
          performance_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_loans: {
        Row: {
          id: number
          employee_id: number
          loan_date: string | null // DATE type
          loan_amount: number | null
          reason: string | null
          status: string | null // Consider ENUM
          remaining_balance: number | null
          repayment_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          employee_id: number
          loan_date?: string | null
          loan_amount?: number | null
          reason?: string | null
          status?: string | null
          remaining_balance?: number | null
          repayment_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          employee_id?: number
          loan_date?: string | null
          loan_amount?: number | null
          reason?: string | null
          status?: string | null
          remaining_balance?: number | null
          repayment_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_loans_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      loan_installments: {
        Row: {
          id: number
          loan_id: number
          payment_date: string | null // DATE type
          amount_paid: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          loan_id: number
          payment_date?: string | null
          amount_paid?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          loan_id?: number
          payment_date?: string | null
          amount_paid?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_installments_loan_id_fkey"
            columns: ["loan_id"]
            referencedRelation: "employee_loans"
            referencedColumns: ["id"]
          }
        ]
      }
      account_ledger_entries: {
        Row: {
          id: number
          entity_type: string | null // Consider ENUM
          entity_name: string | null
          entry_nature: string | null // Consider ENUM
          entry_date: string | null // DATE type
          due_date: string | null // DATE type
          initial_amount: number | null
          remaining_amount: number | null
          description: string | null
          status: string | null // Consider ENUM
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          entity_type?: string | null
          entity_name?: string | null
          entry_nature?: string | null
          entry_date?: string | null
          due_date?: string | null
          initial_amount?: number | null
          remaining_amount?: number | null
          description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          entity_type?: string | null
          entity_name?: string | null
          entry_nature?: string | null
          entry_date?: string | null
          due_date?: string | null
          initial_amount?: number | null
          remaining_amount?: number | null
          description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      account_ledger_payments: {
        Row: {
          id: number
          account_entry_id: number
          payment_date: string | null // DATE type
          amount_paid: number | null
          payment_method: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          account_entry_id: number
          payment_date?: string | null
          amount_paid?: number | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          account_entry_id?: number
          payment_date?: string | null
          amount_paid?: number | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_ledger_payments_account_entry_id_fkey"
            columns: ["account_entry_id"]
            referencedRelation: "account_ledger_entries"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses_data: {
        Row: {
          id: number
          expense_date: string | null // DATE type
          category: string | null // Consider ENUM
          description: string | null
          amount: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          expense_date?: string | null
          category?: string | null
          description?: string | null
          amount?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          expense_date?: string | null
          category?: string | null
          description?: string | null
          amount?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          id: number
          name: string | null
          target_amount: number | null
          current_amount: number | null
          start_date: string | null // DATE type
          target_date: string | null // DATE type
          status: string | null // Consider ENUM
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          target_amount?: number | null
          current_amount?: number | null
          start_date?: string | null
          target_date?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          target_amount?: number | null
          current_amount?: number | null
          start_date?: string | null
          target_date?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      savings_transactions: {
        Row: {
          id: number
          goal_id: number
          transaction_date: string | null // DATE type
          amount: number | null
          type: string | null // Consider ENUM
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          goal_id: number
          transaction_date?: string | null
          amount?: number | null
          type?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          goal_id?: number
          transaction_date?: string | null
          amount?: number | null
          type?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_goal_id_fkey"
            columns: ["goal_id"]
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          }
        ]
      }
      supplier_orders: {
        Row: {
          id: number
          client_order_id: string | null
          order_date: string | null // TIMESTAMPTZ
          items: Json | null // JSONB for array of SupplierOrderItem
          status: string | null // Consider ENUM
          notes: string | null
          supplier_name: string | null
          total_order_quantity: number | null
          received_date: string | null // TIMESTAMPTZ
          invoice_number: string | null
          receiving_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          client_order_id?: string | null
          order_date?: string | null
          items?: Json | null
          status?: string | null
          notes?: string | null
          supplier_name?: string | null
          total_order_quantity?: number | null
          received_date?: string | null
          invoice_number?: string | null
          receiving_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          client_order_id?: string | null
          order_date?: string | null
          items?: Json | null
          status?: string | null
          notes?: string | null
          supplier_name?: string | null
          total_order_quantity?: number | null
          received_date?: string | null
          invoice_number?: string | null
          receiving_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      // Anda bisa mendefinisikan ENUM di sini atau langsung di PostgreSQL
      // product_category_enum: 'Suku Cadang' | 'Aksesoris' | 'Oli & Cairan' | 'Jasa' | 'Lainnya'
      // sale_transaction_type_enum: 'Regular' | 'Partner' | 'Service'
      // service_job_status_enum: 'Antrian' | 'Dikerjakan' | 'Menunggu Konfirmasi' | 'Selesai' | 'Dibatalkan'
      // ... dan seterusnya untuk status dan kategori lainnya
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Anda bisa menjalankan `npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/database.types.ts`
// untuk mendapatkan file ini secara otomatis dari skema database Anda setelah tabel dibuat.
// Ganti <PROJECT_ID> dengan ID proyek Supabase Anda.
