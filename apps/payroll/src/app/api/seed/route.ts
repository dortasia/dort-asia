import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MOCK_EMPLOYEES = [
  {
    name: "KrishnaKumar P",
    role: "Software Engineer",
    emp_id: "DT10192IN26",
    department: "Software Developers",
    email: "Krishnaaa2005p@gmail.com",
    mobile: "123456789",
    job_type: "Full Time",
    initials: "KK",
    color: "#5856D6",
    bg: "#5856D640"
  },
  {
    name: "John Doe",
    role: "Product Manager",
    emp_id: "DT10192IN27",
    department: "Product",
    email: "john.doe@gmail.com",
    mobile: "987654321",
    job_type: "Full Time",
    initials: "JD",
    color: "#007AFF",
    bg: "#007AFF40"
  },
  {
    name: "Jane Smith",
    role: "UI/UX Designer",
    emp_id: "DT10192IN28",
    department: "Design",
    email: "jane.smith@gmail.com",
    mobile: "555123456",
    job_type: "Contract",
    initials: "JS",
    color: "#FF9500",
    bg: "#FF950040"
  },
  {
    name: "Ahmad Silva",
    role: "QA Engineer",
    emp_id: "DT10192IN29",
    department: "Quality Assurance",
    email: "ahmad.silva@gmail.com",
    mobile: "112233445",
    location: "Kuala Lumpur, MY",
    initials: "AS",
    color: "#FF2D55",
    bg: "#FFC1CC"
  },
  {
    name: "Maya Patel",
    role: "HR Specialist",
    emp_id: "DT10192IN30",
    department: "Human Resources",
    email: "maya.patel@gmail.com",
    mobile: "998877665",
    location: "Bengaluru, IN",
    initials: "MP",
    color: "#34C759",
    bg: "#B8F0CC"
  },
];

export async function GET() {
  try {
    // Check if data already exists
    const { count, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Count Error:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json({ message: 'Employees table already seeded', count });
    }

    // Insert mock data
    const { data, error } = await supabase
      .from('employees')
      .insert(MOCK_EMPLOYEES)
      .select();

    if (error) {
      console.error("Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Supabase seeded successfully', data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
