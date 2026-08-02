export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          company_id: string
          created_at: string
          date: string
          employee_id: string
          hours: string | null
          id: string
          location: string | null
          proof_url: string | null
          site_id: string | null
          status: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          company_id: string
          created_at?: string
          date?: string
          employee_id: string
          hours?: string | null
          id?: string
          location?: string | null
          proof_url?: string | null
          site_id?: string | null
          status: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          company_id?: string
          created_at?: string
          date?: string
          employee_id?: string
          hours?: string | null
          id?: string
          location?: string | null
          proof_url?: string | null
          site_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_y2026m07: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          company_id: string
          created_at: string
          date: string
          employee_id: string
          hours: string | null
          id: string
          location: string | null
          proof_url: string | null
          site_id: string | null
          status: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          company_id: string
          created_at?: string
          date?: string
          employee_id: string
          hours?: string | null
          id?: string
          location?: string | null
          proof_url?: string | null
          site_id?: string | null
          status: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          company_id?: string
          created_at?: string
          date?: string
          employee_id?: string
          hours?: string | null
          id?: string
          location?: string | null
          proof_url?: string | null
          site_id?: string | null
          status?: string
        }
        Relationships: []
      }
      attendance_y2026m08: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          company_id: string
          created_at: string
          date: string
          employee_id: string
          hours: string | null
          id: string
          location: string | null
          proof_url: string | null
          site_id: string | null
          status: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          company_id: string
          created_at?: string
          date?: string
          employee_id: string
          hours?: string | null
          id?: string
          location?: string | null
          proof_url?: string | null
          site_id?: string | null
          status: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          company_id?: string
          created_at?: string
          date?: string
          employee_id?: string
          hours?: string | null
          id?: string
          location?: string | null
          proof_url?: string | null
          site_id?: string | null
          status?: string
        }
        Relationships: []
      }
      claim_policies: {
        Row: {
          category: string
          company_id: string
          created_at: string
          department_id: string | null
          hierarchy_setup: Json | null
          id: string
          monthly_limit: number | null
          yearly_limit: number | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          department_id?: string | null
          hierarchy_setup?: Json | null
          id?: string
          monthly_limit?: number | null
          yearly_limit?: number | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          department_id?: string | null
          hierarchy_setup?: Json | null
          id?: string
          monthly_limit?: number | null
          yearly_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_policies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          amount: number
          claim_date: string
          created_at: string
          current_approver_id: string | null
          description: string | null
          employee_id: string
          id: string
          policy_id: string
          receipt_url: string | null
          status: string
        }
        Insert: {
          amount: number
          claim_date: string
          created_at?: string
          current_approver_id?: string | null
          description?: string | null
          employee_id: string
          id?: string
          policy_id: string
          receipt_url?: string | null
          status?: string
        }
        Update: {
          amount?: number
          claim_date?: string
          created_at?: string
          current_approver_id?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          policy_id?: string
          receipt_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_current_approver_id_fkey"
            columns: ["current_approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "claim_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          branch_location: string | null
          company_name: string
          company_type: string | null
          corporate_addres: string | null
          created_at: string
          id: string
          login_email: string | null
          logo_url: string | null
          phone_number: string | null
          sector: string | null
          sign_in_method: string | null
          super_admin_avatar_url: string | null
          super_admin_designation: string | null
          super_admin_id: string | null
          super_admin_name: string | null
          website: string | null
        }
        Insert: {
          branch_location?: string | null
          company_name: string
          company_type?: string | null
          corporate_addres?: string | null
          created_at?: string
          id?: string
          login_email?: string | null
          logo_url?: string | null
          phone_number?: string | null
          sector?: string | null
          sign_in_method?: string | null
          super_admin_avatar_url?: string | null
          super_admin_designation?: string | null
          super_admin_id?: string | null
          super_admin_name?: string | null
          website?: string | null
        }
        Update: {
          branch_location?: string | null
          company_name?: string
          company_type?: string | null
          corporate_addres?: string | null
          created_at?: string
          id?: string
          login_email?: string | null
          logo_url?: string | null
          phone_number?: string | null
          sector?: string | null
          sign_in_method?: string | null
          super_admin_avatar_url?: string | null
          super_admin_designation?: string | null
          super_admin_id?: string | null
          super_admin_name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_module_settings: {
        Row: {
          company_id: string
          created_at: string
          id: string
          module: string
          settings: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          module: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          module?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_module_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          app_config: Json | null
          attendance_settings: Json | null
          auto_overtime: boolean | null
          claim_settings: Json | null
          company_id: string
          company_module_settings: Json | null
          created_at: string
          grace_period_mins: number | null
          id: string
          leave_settings: Json | null
          overtime_settings: Json | null
          require_approval_new_hire: boolean | null
          setup_completed: boolean | null
          shift_end: string | null
          shift_start: string | null
          single_admin_per_department: boolean | null
          working_days: string[] | null
        }
        Insert: {
          app_config?: Json | null
          attendance_settings?: Json | null
          auto_overtime?: boolean | null
          claim_settings?: Json | null
          company_id: string
          company_module_settings?: Json | null
          created_at?: string
          grace_period_mins?: number | null
          id?: string
          leave_settings?: Json | null
          overtime_settings?: Json | null
          require_approval_new_hire?: boolean | null
          setup_completed?: boolean | null
          shift_end?: string | null
          shift_start?: string | null
          single_admin_per_department?: boolean | null
          working_days?: string[] | null
        }
        Update: {
          app_config?: Json | null
          attendance_settings?: Json | null
          auto_overtime?: boolean | null
          claim_settings?: Json | null
          company_id?: string
          company_module_settings?: Json | null
          created_at?: string
          grace_period_mins?: number | null
          id?: string
          leave_settings?: Json | null
          overtime_settings?: Json | null
          require_approval_new_hire?: boolean | null
          setup_completed?: boolean | null
          shift_end?: string | null
          shift_start?: string | null
          single_admin_per_department?: boolean | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sites: {
        Row: {
          address: string | null
          company_id: string
          created_at: string | null
          custom_scanners: Json | null
          dynamic_qr_rotation: boolean | null
          id: string
          is_geofencing_enabled: boolean | null
          is_site_pass_enabled: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          radius: number | null
          scanner_permission: string | null
          site_pass_code: string | null
          site_pass_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string | null
          custom_scanners?: Json | null
          dynamic_qr_rotation?: boolean | null
          id: string
          is_geofencing_enabled?: boolean | null
          is_site_pass_enabled?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          radius?: number | null
          scanner_permission?: string | null
          site_pass_code?: string | null
          site_pass_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string | null
          custom_scanners?: Json | null
          dynamic_qr_rotation?: boolean | null
          id?: string
          is_geofencing_enabled?: boolean | null
          is_site_pass_enabled?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          radius?: number | null
          scanner_permission?: string | null
          site_pass_code?: string | null
          site_pass_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_sites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          manager_id: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          manager_id: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          manager_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          created_date: string | null
          delegation_config: Json | null
          department_name: string
          department_site: string | null
          dept_id: string | null
          description: string | null
          designations: Json | null
          end_time: string | null
          head_id: string | null
          id: string
          start_time: string | null
          theme_accent: string | null
          theme_bg: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_date?: string | null
          delegation_config?: Json | null
          department_name: string
          department_site?: string | null
          dept_id?: string | null
          description?: string | null
          designations?: Json | null
          end_time?: string | null
          head_id?: string | null
          id?: string
          start_time?: string | null
          theme_accent?: string | null
          theme_bg?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_date?: string | null
          delegation_config?: Json | null
          department_name?: string
          department_site?: string | null
          dept_id?: string | null
          description?: string | null
          designations?: Json | null
          end_time?: string | null
          head_id?: string | null
          id?: string
          start_time?: string | null
          theme_accent?: string | null
          theme_bg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_bank_details: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_account_number: string | null
          bank_code: string | null
          bank_name: string | null
          branch_code: string | null
          employee_id: string
          online_payment_id: string | null
          online_payment_type: string | null
          salary_payment_mode: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          branch_code?: string | null
          employee_id: string
          online_payment_id?: string | null
          online_payment_type?: string | null
          salary_payment_mode?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          branch_code?: string | null
          employee_id?: string
          online_payment_id?: string | null
          online_payment_type?: string | null
          salary_payment_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_bank_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certifications: {
        Row: {
          cert_name: string
          certification_url: string | null
          created_at: string
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_org: string | null
        }
        Insert: {
          cert_name: string
          certification_url?: string | null
          created_at?: string
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_org?: string | null
        }
        Update: {
          cert_name?: string
          certification_url?: string | null
          created_at?: string
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_org?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contact_details: {
        Row: {
          current_address: string | null
          current_email: string | null
          current_mobile_number: string | null
          current_postal_code: string | null
          current_residential_address: string | null
          employee_id: string
          instagram_url: string | null
          linkedin_url: string | null
          mobile_code: string | null
          native_address: string | null
          native_mobile_code: string | null
          native_mobile_number: string | null
          native_postal_code: string | null
          native_residential_address: string | null
          postal_code: string | null
          residential_address: string | null
        }
        Insert: {
          current_address?: string | null
          current_email?: string | null
          current_mobile_number?: string | null
          current_postal_code?: string | null
          current_residential_address?: string | null
          employee_id: string
          instagram_url?: string | null
          linkedin_url?: string | null
          mobile_code?: string | null
          native_address?: string | null
          native_mobile_code?: string | null
          native_mobile_number?: string | null
          native_postal_code?: string | null
          native_residential_address?: string | null
          postal_code?: string | null
          residential_address?: string | null
        }
        Update: {
          current_address?: string | null
          current_email?: string | null
          current_mobile_number?: string | null
          current_postal_code?: string | null
          current_residential_address?: string | null
          employee_id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          mobile_code?: string | null
          native_address?: string | null
          native_mobile_code?: string | null
          native_mobile_number?: string | null
          native_postal_code?: string | null
          native_residential_address?: string | null
          postal_code?: string | null
          residential_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_contact_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_declarations: {
        Row: {
          digital_signature: string | null
          emp_declaration: boolean | null
          employee_id: string
          privacy_consent: boolean | null
          terms_accepted: boolean | null
        }
        Insert: {
          digital_signature?: string | null
          emp_declaration?: boolean | null
          employee_id: string
          privacy_consent?: boolean | null
          terms_accepted?: boolean | null
        }
        Update: {
          digital_signature?: string | null
          emp_declaration?: boolean | null
          employee_id?: string
          privacy_consent?: boolean | null
          terms_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_declarations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: string
          created_at: string
          document_name: string
          employee_id: string
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          category: string
          created_at?: string
          document_name: string
          employee_id: string
          file_type: string
          file_url: string
          id?: string
        }
        Update: {
          category?: string
          created_at?: string
          document_name?: string
          employee_id?: string
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_education: {
        Row: {
          certifications: Json | null
          employee_id: string
          higher_edu_cert_url: string | null
          higher_edu_country: string | null
          higher_edu_course: string | null
          higher_edu_course_duration: string | null
          higher_edu_grad_year: string | null
          higher_edu_institution: string | null
          higher_edu_qualification: string | null
          schooling_cert_url: string | null
          schooling_country: string | null
          schooling_grad_year: string | null
          schooling_institution: string | null
          schooling_qualification: string | null
        }
        Insert: {
          certifications?: Json | null
          employee_id: string
          higher_edu_cert_url?: string | null
          higher_edu_country?: string | null
          higher_edu_course?: string | null
          higher_edu_course_duration?: string | null
          higher_edu_grad_year?: string | null
          higher_edu_institution?: string | null
          higher_edu_qualification?: string | null
          schooling_cert_url?: string | null
          schooling_country?: string | null
          schooling_grad_year?: string | null
          schooling_institution?: string | null
          schooling_qualification?: string | null
        }
        Update: {
          certifications?: Json | null
          employee_id?: string
          higher_edu_cert_url?: string | null
          higher_edu_country?: string | null
          higher_edu_course?: string | null
          higher_edu_course_duration?: string | null
          higher_edu_grad_year?: string | null
          higher_edu_institution?: string | null
          higher_edu_qualification?: string | null
          schooling_cert_url?: string | null
          schooling_country?: string | null
          schooling_grad_year?: string | null
          schooling_institution?: string | null
          schooling_qualification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_education_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_identity_docs: {
        Row: {
          employee_id: string
          fin_number: string | null
          issuing_country: string | null
          nric_copy_url: string | null
          nric_number: string | null
          pass_copy_url: string | null
          pass_expiry_date: string | null
          pass_issue_date: string | null
          pass_number: string | null
          pass_type: string | null
          passport_copy_url: string | null
          passport_expiry: string | null
          passport_number: string | null
          work_permit_skill: string | null
        }
        Insert: {
          employee_id: string
          fin_number?: string | null
          issuing_country?: string | null
          nric_copy_url?: string | null
          nric_number?: string | null
          pass_copy_url?: string | null
          pass_expiry_date?: string | null
          pass_issue_date?: string | null
          pass_number?: string | null
          pass_type?: string | null
          passport_copy_url?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          work_permit_skill?: string | null
        }
        Update: {
          employee_id?: string
          fin_number?: string | null
          issuing_country?: string | null
          nric_copy_url?: string | null
          nric_number?: string | null
          pass_copy_url?: string | null
          pass_expiry_date?: string | null
          pass_issue_date?: string | null
          pass_number?: string | null
          pass_type?: string | null
          passport_copy_url?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          work_permit_skill?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_identity_docs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_insurance: {
        Row: {
          children_coverage: string | null
          deps_covered: string | null
          emp_covered: string | null
          employee_id: string
          insur_coverage_amt: number | null
          insur_payment_freq: string | null
          insur_policy_expiry: string | null
          insur_policy_num: string | null
          insur_policy_start: string | null
          insur_premium_amt: number | null
          insur_provider: string | null
          insurance_type: string | null
          num_deps: number | null
          parents_coverage: string | null
          spouse_coverage: string | null
        }
        Insert: {
          children_coverage?: string | null
          deps_covered?: string | null
          emp_covered?: string | null
          employee_id: string
          insur_coverage_amt?: number | null
          insur_payment_freq?: string | null
          insur_policy_expiry?: string | null
          insur_policy_num?: string | null
          insur_policy_start?: string | null
          insur_premium_amt?: number | null
          insur_provider?: string | null
          insurance_type?: string | null
          num_deps?: number | null
          parents_coverage?: string | null
          spouse_coverage?: string | null
        }
        Update: {
          children_coverage?: string | null
          deps_covered?: string | null
          emp_covered?: string | null
          employee_id?: string
          insur_coverage_amt?: number | null
          insur_payment_freq?: string | null
          insur_policy_expiry?: string | null
          insur_policy_num?: string | null
          insur_policy_start?: string | null
          insur_premium_amt?: number | null
          insur_provider?: string | null
          insurance_type?: string | null
          num_deps?: number | null
          parents_coverage?: string | null
          spouse_coverage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_insurance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_personal_details: {
        Row: {
          blood_group: string | null
          date_of_birth: string | null
          emergency_contact_address: string | null
          emergency_contact_code: string | null
          emergency_contact_name: string | null
          emergency_contact_number: string | null
          emergency_contact_relation: string | null
          employee_id: string
          gender: string | null
          marital_status: string | null
          nationality: string | null
          personal_email: string | null
          personal_number: string | null
          race: string | null
          religion: string | null
        }
        Insert: {
          blood_group?: string | null
          date_of_birth?: string | null
          emergency_contact_address?: string | null
          emergency_contact_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relation?: string | null
          employee_id: string
          gender?: string | null
          marital_status?: string | null
          nationality?: string | null
          personal_email?: string | null
          personal_number?: string | null
          race?: string | null
          religion?: string | null
        }
        Update: {
          blood_group?: string | null
          date_of_birth?: string | null
          emergency_contact_address?: string | null
          emergency_contact_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string
          gender?: string | null
          marital_status?: string | null
          nationality?: string | null
          personal_email?: string | null
          personal_number?: string | null
          race?: string | null
          religion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_personal_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salary: {
        Row: {
          allowance: Json | null
          base_salary: number
          cdac: number | null
          cdac_rate: number | null
          comments: string | null
          company_id: string
          cpf_employee: number | null
          cpf_employer: number | null
          created_at: string
          ecf: number | null
          ecf_rate: number | null
          effective_date: string
          employee_id: string
          foreign_worker_levy: number | null
          id: string
          iras: number | null
          iras_rate: number | null
          mbmf: number | null
          mbmf_rate: number | null
          sdl: number | null
          sdl_rate: number | null
          sinda: number | null
          sinda_rate: number | null
        }
        Insert: {
          allowance?: Json | null
          base_salary: number
          cdac?: number | null
          cdac_rate?: number | null
          comments?: string | null
          company_id: string
          cpf_employee?: number | null
          cpf_employer?: number | null
          created_at?: string
          ecf?: number | null
          ecf_rate?: number | null
          effective_date: string
          employee_id: string
          foreign_worker_levy?: number | null
          id?: string
          iras?: number | null
          iras_rate?: number | null
          mbmf?: number | null
          mbmf_rate?: number | null
          sdl?: number | null
          sdl_rate?: number | null
          sinda?: number | null
          sinda_rate?: number | null
        }
        Update: {
          allowance?: Json | null
          base_salary?: number
          cdac?: number | null
          cdac_rate?: number | null
          comments?: string | null
          company_id?: string
          cpf_employee?: number | null
          cpf_employer?: number | null
          created_at?: string
          ecf?: number | null
          ecf_rate?: number | null
          effective_date?: string
          employee_id?: string
          foreign_worker_levy?: number | null
          id?: string
          iras?: number | null
          iras_rate?: number | null
          mbmf?: number | null
          mbmf_rate?: number | null
          sdl?: number | null
          sdl_rate?: number | null
          sinda?: number | null
          sinda_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salary_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_work_details: {
        Row: {
          claims_applicable: boolean | null
          employee_id: string
          job_type: string | null
          overtime_applicable: boolean | null
          shift_type: string | null
        }
        Insert: {
          claims_applicable?: boolean | null
          employee_id: string
          job_type?: string | null
          overtime_applicable?: boolean | null
          shift_type?: string | null
        }
        Update: {
          claims_applicable?: boolean | null
          employee_id?: string
          job_type?: string | null
          overtime_applicable?: boolean | null
          shift_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_work_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          app_role: string
          avatar_url: string | null
          company_id: string
          created_at: string
          custom_fields: Json | null
          date_of_birth: string | null
          date_of_joining: string | null
          department_head: string | null
          department_id: string | null
          designation: string | null
          email: string
          emp_id: string | null
          first_name: string | null
          gender: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_head: boolean | null
          last_name: string | null
          leave_policy_id: string | null
          linkedin_url: string | null
          manager_id: string | null
          marital_status: string | null
          name: string
          nationality: string | null
          pass_type: string | null
          phone_number: string | null
          race: string | null
          religion: string | null
          report_attendance_to: string | null
          report_claim_to: string | null
          report_leave_to: string | null
          reporting_department_id: string | null
          skill_status: string | null
          user_id: string | null
        }
        Insert: {
          app_role?: string
          avatar_url?: string | null
          company_id: string
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          department_head?: string | null
          department_id?: string | null
          designation?: string | null
          email: string
          emp_id?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_head?: boolean | null
          last_name?: string | null
          leave_policy_id?: string | null
          linkedin_url?: string | null
          manager_id?: string | null
          marital_status?: string | null
          name: string
          nationality?: string | null
          pass_type?: string | null
          phone_number?: string | null
          race?: string | null
          religion?: string | null
          report_attendance_to?: string | null
          report_claim_to?: string | null
          report_leave_to?: string | null
          reporting_department_id?: string | null
          skill_status?: string | null
          user_id?: string | null
        }
        Update: {
          app_role?: string
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          department_head?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string
          emp_id?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_head?: boolean | null
          last_name?: string | null
          leave_policy_id?: string | null
          linkedin_url?: string | null
          manager_id?: string | null
          marital_status?: string | null
          name?: string
          nationality?: string | null
          pass_type?: string | null
          phone_number?: string | null
          race?: string | null
          religion?: string | null
          report_attendance_to?: string | null
          report_claim_to?: string | null
          report_leave_to?: string | null
          reporting_department_id?: string | null
          skill_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_head_fkey"
            columns: ["department_head"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_master_department_head_fkey"
            columns: ["department_head"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_report_attendance_to_fkey"
            columns: ["report_attendance_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_report_claim_to_fkey"
            columns: ["report_claim_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_report_leave_to_fkey"
            columns: ["report_leave_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_reporting_department_id_fkey"
            columns: ["reporting_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      fwl_rate_master: {
        Row: {
          created_at: string
          id: string
          monthly_rate: number
          pass_type: string
          ratio_max: number
          ratio_min: number
          sector: string
          skill_level: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_rate: number
          pass_type: string
          ratio_max: number
          ratio_min: number
          sector: string
          skill_level: string
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_rate?: number
          pass_type?: string
          ratio_max?: number
          ratio_min?: number
          sector?: string
          skill_level?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_policies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          leave_configuration: Json
          template_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          leave_configuration?: Json
          template_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          leave_configuration?: Json
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          attachment_url: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          manager_id: string | null
          reason: string | null
          start_date: string
          status: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          manager_id?: string | null
          reason?: string | null
          start_date: string
          status?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          manager_id?: string | null
          reason?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_attendance_partition: { Args: never; Returns: undefined }
      get_department_employees_for_attendance: {
        Args: { target_dept_id: string }
        Returns: {
          app_role: string
          avatar_url: string | null
          company_id: string
          created_at: string
          custom_fields: Json | null
          date_of_birth: string | null
          date_of_joining: string | null
          department_head: string | null
          department_id: string | null
          designation: string | null
          email: string
          emp_id: string | null
          first_name: string | null
          gender: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_head: boolean | null
          last_name: string | null
          leave_policy_id: string | null
          linkedin_url: string | null
          manager_id: string | null
          marital_status: string | null
          name: string
          nationality: string | null
          pass_type: string | null
          phone_number: string | null
          race: string | null
          religion: string | null
          report_attendance_to: string | null
          report_claim_to: string | null
          report_leave_to: string | null
          reporting_department_id: string | null
          skill_status: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "employees"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_employee_context: {
        Args: never
        Returns: {
          my_company_id: string
          my_is_active: boolean
          my_role: string
        }[]
      }
      is_active_company_member: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      is_admin_in_company: {
        Args: { target_company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
