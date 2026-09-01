// Indian States and Major Districts Dataset for YUVA-RAKT AI

export interface StateDistrictMap {
  [state: string]: string[];
}

export const INDIA_STATES_DISTRICTS: StateDistrictMap = {
  "Andhra Pradesh": [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna",
    "Kurnool", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
  ],
  "Assam": [
    "Baksa", "Barpeta", "Cachar", "Darrang", "Dhubri", "Dibrugarh", "Goalpara", "Guwahati / Kamrup", "Jorhat", "Nagaon", "Silchar", "Tezpur"
  ],
  "Bihar": [
    "Bhagalpur", "Darbhanga", "Gaya", "Muzaffarpur", "Nalanda", "Patna", "Purnia", "Rohtas", "Samastipur", "Saran", "Vaishali"
  ],
  "Delhi (NCT)": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Bharuch", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh", "Kutch", "Mehsana", "Rajkot", "Surat", "Vadodara"
  ],
  "Haryana": [
    "Ambala", "Faridabad", "Gurugram", "Hisar", "Karnal", "Panipat", "Rohtak", "Sonipat", "Yamunanagar"
  ],
  "Karnataka": [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar",
    "Dakshina Kannada (Mangaluru)", "Dharwad (Hubballi)", "Kalaburagi", "Mysuru", "Shivamogga", "Tumakuru", "Udupi"
  ],
  "Kerala": [
    "Alappuzha", "Ernakulam (Kochi)", "Idukki", "Kannur", "Kasaragod", "Kollam",
    "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Gwalior", "Indore", "Jabalpur", "Khandwa", "Rewa", "Sagar", "Satna", "Ujjain"
  ],
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad (Chhatrapati Sambhajinagar)", "Kolhapur",
    "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Pune", "Solapur", "Thane"
  ],
  "Odisha": [
    "Balasore", "Berhampur", "Bhadrak", "Bhubaneswar", "Cuttack", "Ganjam", "Puri", "Rourkela", "Sambalpur"
  ],
  "Punjab": [
    "Amritsar", "Bathinda", "Hoshiarpur", "Jalandhar", "Ludhiana", "Mohali (SAS Nagar)", "Patiala"
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Bikaner", "Jaipur", "Jodhpur", "Kota", "Sikar", "Udaipur"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Kanchipuram", "Madurai",
    "Salem", "Thanjavur", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Vellore"
  ],
  "Telangana": [
    "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Medak", "Nalgonda",
    "Nizamabad", "Rangareddy", "Sangareddy", "Secunderabad", "Warangal"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ayodhya", "Bareilly", "Ghaziabad", "Gorakhpur", "Jhansi",
    "Kanpur", "Lucknow", "Mathura", "Meerut", "Moradabad", "Noida / Gautam Buddha Nagar", "Prayagraj", "Varanasi"
  ],
  "West Bengal": [
    "Asansol", "Darjeeling", "Durgapur", "Howrah", "Kolkata", "Malda", "North 24 Parganas", "Siliguri", "South 24 Parganas"
  ]
};

export function getIndianStates(): string[] {
  return Object.keys(INDIA_STATES_DISTRICTS).sort();
}

export function getDistrictsForState(state: string): string[] {
  return INDIA_STATES_DISTRICTS[state] || [];
}
