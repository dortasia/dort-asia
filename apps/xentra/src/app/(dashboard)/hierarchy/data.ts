export interface OrgMember {
  id: string;
  name: string;
  role: string;
  departmentLabel?: string;
  location: string;
  avatar: string;
  badgeColor: string;
  email?: string;
  mobile?: string;
  managerName?: string;
  children?: OrgMember[];
  staffList?: OrgMember[]; // specialized for vertical spine layout
}

export const mockOrgData: OrgMember = {
  id: "coo-1",
  name: "Brooklyn Simmons",
  role: "COO",
  location: "San Diego, CA",
  avatar: "https://i.pravatar.cc/150?img=47",
  badgeColor: "#1FC6A4",
  children: [
    {
      id: "mgr-1",
      name: "Leslie Alexander",
      role: "Marketing/Manager",
      departmentLabel: "Marketing",
      location: "San Diego, CA",
      avatar: "https://i.pravatar.cc/150?img=11",
      badgeColor: "#1FC6A4",
      managerName: "Brooklyn Simmons",
      email: "leslie@worthbox.com",
      mobile: "(201) 555-0123",
      staffList: [
        {
          id: "emp-1",
          name: "Ronald Richards",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=33",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        },
        {
          id: "emp-2",
          name: "Dianne Russell",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=44",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
          email: "dianneruss@worthbox.com",
          mobile: "(201) 953-436",
          children: [
             {
               id: "emp-2-1",
               name: "Devon Lane",
               role: "Marketing/Manager",
               location: "San Diego, CA",
               avatar: "https://i.pravatar.cc/150?img=53",
               badgeColor: "#1FC6A4",
               managerName: "Dianne Russell",
             },
             {
               id: "emp-2-2",
               name: "Guy Hawkins",
               role: "Marketing/Manager",
               location: "San Diego, CA",
               avatar: "https://i.pravatar.cc/150?img=60",
               badgeColor: "#1FC6A4",
               managerName: "Dianne Russell",
             }
          ]
        },
        {
          id: "emp-3",
          name: "Robert Fox",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=68",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        },
        {
          id: "emp-4",
          name: "Wade Warren",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=12",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        },
        {
          id: "emp-5",
          name: "Marvin McKinney",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=15",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        },
        {
          id: "emp-6",
          name: "Arlene McCoy",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=16",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        },
        {
          id: "emp-7",
          name: "Darlene Robertson",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=26",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        },
        {
          id: "emp-8",
          name: "Theresa Webb",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=38",
          badgeColor: "#1FC6A4",
          managerName: "Leslie Alexander",
        }
      ]
    },
    {
      id: "mgr-2",
      name: "Cody Fisher",
      role: "Marketing/Manager",
      departmentLabel: "Sales",
      location: "San Diego, CA",
      avatar: "https://i.pravatar.cc/150?img=36",
      badgeColor: "#1FC6A4",
      managerName: "Brooklyn Simmons",
      staffList: [
        {
          id: "emp-s-1",
          name: "Ronald Richards",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=55",
          badgeColor: "#1FC6A4",
          managerName: "Cody Fisher",
        },
        {
          id: "emp-s-2",
          name: "Jenny Wilson",
          role: "Marketing/Manager",
          location: "San Diego, CA",
          avatar: "https://i.pravatar.cc/150?img=65",
          badgeColor: "#1FC6A4",
          managerName: "Cody Fisher",
        }
      ]
    }
  ]
};
