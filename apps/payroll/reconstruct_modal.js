const fs = require('fs');
const path = 'src/components/OnboardingModal.tsx';
let txt = fs.readFileSync(path, 'utf8');
const lines = txt.split('\n');

// Find end of step 1: 
// 1127:           )}
// 1128:
// 1129:           {/* Step 2: Onboard Departments */}
const startIdx = lines.findIndex(l => l.includes('{/* Step 2: Onboard Departments */}'));

// Find start of cropper modal
//       {/* Cropper Modal Window Overlay */}
const endIdx = lines.findIndex(l => l.includes('{/* Cropper Modal Window Overlay */}'));

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find start or end markers");
  process.exit(1);
}

const beforeBlock = lines.slice(0, startIdx).join('\n');
// endIdx is the line with {/* Cropper ... */}. We should keep from endIdx-2 to include the closing tags.
// Wait, the cropper is outside the main wrapper?
// Let's check lines near endIdx.
// 1365:           )}
// 1366: 
// 1367:         </div>
// 1368:       </div>
// 1369: 
// 1370:       {/* Cropper Modal Window Overlay */}
// So we keep from endIdx-4 (the `)}` line).
let suffixIdx = endIdx;
while (suffixIdx > 0 && !lines[suffixIdx-1].includes(')}')) {
    suffixIdx--;
}
suffixIdx--; // include the ')}'

const afterBlock = lines.slice(suffixIdx).join('\n');

const middleBlock = `          {/* Step 2: Onboard Departments */}
          {step === 2 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: getAvatarColor(companyName || 'Company').bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: getAvatarColor(companyName || 'Company').color }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: getAvatarColor(\`\${adminFirstName} \${adminLastName}\`.trim() || 'Admin').bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: getAvatarColor(\`\${adminFirstName} \${adminLastName}\`.trim() || 'Admin').color }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">2 out of 5</span>
                </div>
              </div>

              <div className="flex w-full flex-1 border-t border-[#E5E5EA] overflow-hidden">
                <div className="w-[50%] flex flex-col px-[55px] py-[35px] border-r border-[#E5E5EA] h-full overflow-hidden">
                  <h3 className="text-[17px] font-bold !text-[#1C1C1E] mb-1 shrink-0 flex items-center gap-2">
                    Created Departments <span className="text-[11px] font-bold text-[#FF9500] uppercase tracking-wider bg-[#FF9500]/10 px-2 py-[2px] rounded-md">(Max 5 While Setup)</span>
                  </h3>
                  <p className="text-[13px] font-medium !text-[#8E8E93] mb-6 shrink-0">Departments can be updated and configured after setup</p>
                  
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                    {createdDepartments.length === 0 ? (
                      <div className="w-full h-[100px] border-2 border-dashed border-[#E5E5EA] rounded-[18px] flex items-center justify-center">
                        <span className="text-[#8E8E93] text-[13px] font-medium">No departments created yet</span>
                      </div>
                    ) : (
                      createdDepartments.map((dept) => {
                        return (
                          <div key={dept.id} className="w-full bg-[#FAFAFC] rounded-[32px] p-5 flex items-center justify-between transition-all hover:bg-[#F2F2F7] border border-[#E5E5EA]">
                            <div className="flex items-center gap-4 flex-[1.5] min-w-0">
                              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold text-[16px] shrink-0 bg-[#FF3B30]/10 text-[#FF3B30]">{dept.name.substring(0,2).toUpperCase()}</div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[15px] font-bold !text-[#1C1C1E] truncate">{dept.name}</span>
                                <span className="text-[12px] font-medium text-[#8E8E93] truncate">{dept.description || 'Description'}</span>
                              </div>
                            </div>
                            
                            <div className="flex-1 text-center shrink-0">
                              <span className="text-[14px] font-semibold !text-[#1C1C1E] whitespace-nowrap">{dept.designations.length} Designation Created</span>
                            </div>

                            <button onClick={() => handleRemoveDepartment(dept.id)} className="h-10 w-10 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full flex items-center justify-center transition-colors shrink-0">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="absolute bottom-[35px] left-[55px] right-[55px] flex justify-between items-center bg-white z-[20]">
                    <button onClick={() => setStep(1)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors">Back</button>
                    <button onClick={handleNext} className="h-[52px] px-[40px] !bg-[#007AFF] hover:!bg-[#0062CC] active:scale-[0.98] text-white font-bold rounded-[14px] transition-all text-[15px]">Continue</button>
                  </div>
                </div>

                <div className="w-[50%] flex flex-col px-[55px] py-[35px] relative h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-[100px]">
                    <h2 className="text-[28px] font-extrabold !text-[#1C1C1E] mb-2 tracking-tight text-center">Onboard Departments</h2>
                    <p className="text-[14px] font-medium !text-[#8E8E93] text-center mb-10">Create departments to deploy your employees</p>
                    <div className="w-full max-w-[480px] mx-auto space-y-5">
                      <div className="relative">
                        <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Department Name</label>
                        <input type="text" placeholder="Enter department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC]" />
                      </div>
                      <div className="relative">
                        <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Description</label>
                        <input type="text" placeholder="About this department" value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} maxLength={100} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC]" />
                      </div>
                      <div className="relative flex items-center gap-3">
                        <div className="relative flex-1">
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Designations</label>
                          <input type="text" placeholder="Type & press Enter or Add" value={desigName} onChange={(e) => setDesigName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (desigName.trim()) handleAddDesignation(); else if (deptName.trim() && createdDepartments.length < 5) handleDeployDepartment(); } }}
                            className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC]" />
                        </div>
                        <button onClick={handleDeployDepartment} disabled={!deptName.trim() || createdDepartments.length >= 5} className="h-[52px] px-[20px] shrink-0 !bg-[#007AFF] hover:!bg-[#0062CC] active:scale-[0.97] text-white font-bold rounded-[16px] text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
                      </div>

                      {designations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {designations.map(d => (
                            <div key={d} className="flex items-center gap-2 !bg-[#F2F2F7] px-3 py-1.5 rounded-full animate-in fade-in duration-200">
                              <span className="text-[12px] font-semibold !text-[#1C1C1E]">{d}</span>
                              <button onClick={() => handleRemoveDesignation(d)} className="!text-[#8E8E93] hover:!text-[#1C1C1E] transition-colors"><X className="w-[11px] h-[11px] stroke-[2.5]" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Onboard Employees */}
          {step === 3 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: getAvatarColor(companyName || 'Company').bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: getAvatarColor(companyName || 'Company').color }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: getAvatarColor(\`\${adminFirstName} \${adminLastName}\`.trim() || 'Admin').bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: getAvatarColor(\`\${adminFirstName} \${adminLastName}\`.trim() || 'Admin').color }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">3 out of 5</span>
                </div>
              </div>
              <div className="flex w-full flex-1 border-t border-[#E5E5EA] overflow-hidden">
                <div className="w-[50%] flex flex-col px-[55px] py-[35px] border-r border-[#E5E5EA] h-full overflow-hidden">
                  <h3 className="text-[17px] font-bold !text-[#1C1C1E] mb-1 shrink-0 flex items-center gap-2">
                    Deployed Employees <span className="text-[11px] font-bold text-[#FF9500] uppercase tracking-wider bg-[#FF9500]/10 px-2 py-[2px] rounded-md">(Max 15 While Setup)</span>
                  </h3>
                  <p className="text-[13px] font-medium !text-[#8E8E93] mb-6 shrink-0">The Deployed Employees are partially onboarded, update them after Setup</p>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                    {deployedEmployees.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-60 mt-8">
                        <p className="font-semibold !text-[#8E8E93] text-[14px]">No employees added yet</p>
                        <p className="text-[12px] !text-[#A1A1A6] mt-1 max-w-[200px]">Add your team members using the form to deploy them.</p>
                      </div>
                    ) : (
                      deployedEmployees.map(emp => (
                        <div key={emp.id} className="w-full bg-[#FAFAFC] rounded-[16px] p-3.5 px-4 flex items-center justify-between border border-[#E5E5EA]">
                          <div className="flex items-center gap-3 flex-[2] min-w-0">
                            <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(emp.firstName).bg }}>
                              <span className="text-white font-bold text-[13px]">{emp.firstName.charAt(0)}{emp.lastName.charAt(0)}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-bold !text-[#1C1C1E] truncate">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[11px] font-medium !text-[#8E8E93] truncate">{emp.email}</span>
                            </div>
                          </div>
                          <div className="flex flex-col flex-1 pl-3 border-l border-[#E5E5EA] min-w-0">
                            <span className="text-[13px] font-bold !text-[#1C1C1E] truncate">{emp.department}</span>
                            <span className="text-[11px] font-medium !text-[#8E8E93] truncate">{emp.designation}</span>
                          </div>
                          <button onClick={() => handleRemoveDeployedEmployee(emp.id)} className="ml-3 h-8 w-8 !bg-[#FFE5E5] hover:!bg-[#FFD1D1] rounded-full flex items-center justify-center transition-colors shrink-0">
                            <Trash2 className="h-4 w-4 !text-[#FF3B30]" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="w-[50%] flex flex-col px-[55px] py-[35px] relative h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-[100px]">
                    <h2 className="text-[28px] font-extrabold !text-[#1C1C1E] mb-2 tracking-tight text-center">Onboard Employees</h2>
                    <p className="text-[14px] font-medium !text-[#8E8E93] text-center mb-10">Deploy employees to their respective departments</p>
                    <div className="w-full max-w-[480px] mx-auto space-y-5">
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">First Name</label>
                          <input type="text" placeholder="First Name" value={empFirstName} onChange={(e) => setEmpFirstName(e.target.value.replace(/[^a-zA-Z\\s]/g, ''))} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC]" />
                        </div>
                        <div className="relative flex-1">
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Last Name</label>
                          <input type="text" placeholder="Last Name" value={empLastName} onChange={(e) => setEmpLastName(e.target.value.replace(/[^a-zA-Z\\s]/g, ''))} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC]" />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Email Address</label>
                        <input type="email" placeholder="Enter email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value.trim())} className="w-full h-[52px] px-5 bg-white !shadow-none border border-[#E5E5EA] rounded-[16px] text-[15px] font-semibold !text-[#1C1C1E] focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all placeholder:text-[#C7C7CC]" />
                      </div>
                      <div className="flex gap-4">
                        <div className="relative flex-1" style={{ zIndex: 102 }}>
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Gender</label>
                          <CustomSelect value={empGender} onChange={setEmpGender} options={["Male", "Female", "Other"]} placeholder="Choose Gender" />
                        </div>
                        <div className="relative flex-1" style={{ zIndex: 102 }}>
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Department</label>
                          <CustomSelect value={empDept} onChange={(val) => { setEmpDept(val); setEmpDesig(""); }} options={createdDepartments.map(d => d.name)} placeholder="Choose Dept" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="relative flex-1" style={{ zIndex: 101 }}>
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">Designation</label>
                          <CustomSelect value={empDesig} onChange={setEmpDesig} options={empDept ? (createdDepartments.find(d => d.name === empDept)?.designations || []) : []} placeholder="Choose Designation" />
                        </div>
                        <div className="relative flex-1" style={{ zIndex: 101 }}>
                          <label className="absolute left-[18px] -top-2.5 bg-white px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] z-10">App Role</label>
                          <CustomSelect value={empRole} onChange={setEmpRole} options={["Admin", "Sub Admin", "Employee"]} placeholder="Choose Role" />
                        </div>
                      </div>
                      {errorLine && <p className="text-[#FF3B30] text-[13px] font-semibold text-center mt-2">{errorLine}</p>}
                      
                      <div className="flex justify-center mt-8">
                        <button 
                          onClick={handleAddEmployee} 
                          className="w-[200px] h-[52px] !bg-[#007AFF] hover:!bg-[#0062CC] active:scale-[0.98] text-white font-bold rounded-[14px] transition-all text-[15px]"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-[35px] left-[55px] right-[55px] flex justify-between items-center bg-white z-[20]">
                    <button onClick={() => setStep(2)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors">Back</button>
                    <button 
                      onClick={() => { setStep(4); if (createdDepartments.length > 0 && !selectedOverviewDept) setSelectedOverviewDept(createdDepartments[0].name); }} 
                      className="h-[52px] px-[40px] !bg-[#007AFF] hover:!bg-[#0062CC] active:scale-[0.98] text-white font-bold rounded-[14px] transition-all text-[15px]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Overview */}
          {step === 4 && (
            <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
              <div className="w-full flex items-center justify-between px-10 py-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: getAvatarColor(companyName || 'Company').bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                      {(croppedPreviewUrl || profilePic) ? (<img src={croppedPreviewUrl ?? profilePic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Company" />) : (<span className="avatar-initials" style={{ fontSize: 20, fontWeight: 800, color: getAvatarColor(companyName || 'Company').color }}>{getInitials(companyName || 'CO')}</span>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: getAvatarColor(\`\${adminFirstName} \${adminLastName}\`.trim() || 'Admin').bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(adminCroppedUrl || adminPic) ? (<img src={adminCroppedUrl ?? adminPic!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Admin" />) : (<span className="avatar-initials" style={{ fontSize: 9, fontWeight: 800, color: getAvatarColor(\`\${adminFirstName} \${adminLastName}\`.trim() || 'Admin').color }}>{adminFirstName ? (adminFirstName[0] + (adminLastName?.[0] || '')).toUpperCase() : getInitials(companyName || 'CO')}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="onboarding-dark-gray-text text-[11px] font-medium leading-none">Company</span>
                    <span className="text-[#000000] text-[16px] font-bold leading-none">{companyName || 'Your Company'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="text-[#8E8E93] font-medium">Phase : </span>
                  <span className="text-[#007AFF] font-bold">4 out of 5</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col border-t border-[#E5E5EA] overflow-hidden">
                <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">
                  <div className="flex flex-col items-center mt-8 mb-8 shrink-0">
                    <h1 className="text-[28px] font-extrabold !text-[#1C1C1E] mb-1 tracking-tight">Overview</h1>
                    <p className="text-[14px] font-medium !text-[#8E8E93]">Verify your Deployments</p>
                  </div>

                  <div className="flex gap-6 px-[55px] flex-1 pb-[120px] overflow-visible">
                    {/* Left side: Departments List */}
                    <div className="w-1/3 bg-[#FAFAFC] rounded-[24px] p-5 flex flex-col border border-[#E5E5EA]">
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                        {createdDepartments.map(dept => {
                          const empCount = deployedEmployees.filter(e => e.department === dept.name).length;
                          const isActive = selectedOverviewDept === dept.name;
                          return (
                            <div 
                              key={dept.id} 
                              onClick={() => setSelectedOverviewDept(dept.name)}
                              className={\`bg-white rounded-[20px] p-4 flex items-center justify-between cursor-pointer transition-all border \${isActive ? 'border-[#007AFF] ring-1 ring-[#007AFF]/20' : 'border-[#E5E5EA] hover:border-[#C7C7CC]'}\`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center border border-[#007AFF]/10 shrink-0" style={{ backgroundColor: getAvatarColor(dept.name).bg }}>
                                  <span className="text-white font-bold text-[14px]">{dept.name.substring(0,2).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[15px] font-bold !text-[#1C1C1E] truncate">{dept.name}</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <div className="flex -space-x-1.5 shrink-0">
                                      <div className="w-3.5 h-3.5 rounded-full bg-[#34C759] border border-white"></div>
                                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF9500] border border-white"></div>
                                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF3B30] border border-white"></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-[#007AFF] ml-1">{empCount} Employees</span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className={\`w-5 h-5 ml-2 shrink-0 transition-colors \${isActive ? 'text-[#007AFF]' : 'text-[#C7C7CC]'}\`} />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Right side: Employees Filtered */}
                    <div className="w-2/3 bg-[#FAFAFC] rounded-[24px] p-6 flex flex-col border border-[#E5E5EA]">
                      <div className="flex-1 overflow-y-auto page-scrollbar pr-2 space-y-4">
                          {deployedEmployees.filter(e => e.department === selectedOverviewDept).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-60">
                              <p className="font-semibold text-[#8E8E93] text-[15px]">No employees in this department</p>
                            </div>
                          ) : (
                            deployedEmployees.filter(e => e.department === selectedOverviewDept).map(emp => (
                              <div key={emp.id} className="w-full bg-white rounded-[20px] p-4 flex items-center gap-5 border border-[#E5E5EA]">
                                <div className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: getAvatarColor(emp.firstName).bg }}>
                                  <span className="text-white font-bold text-[14px]">
                                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-[15px] font-bold !text-[#1C1C1E] truncate">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-[12px] font-medium !text-[#8E8E93] truncate">{emp.email}</span>
                                </div>

                                <div className="flex flex-col flex-1 min-w-0 border-l border-[#E5E5EA] pl-5">
                                  <span className="text-[14px] font-bold !text-[#1C1C1E] truncate">{emp.department}</span>
                                  <span className="text-[11px] font-medium !text-[#8E8E93] truncate">{emp.designation}</span>
                                </div>

                                <div className="text-[14px] font-semibold !text-[#1C1C1E] w-[70px] text-center">
                                  {emp.gender}
                                </div>
                                
                                <div className="text-[14px] font-bold !text-[#1C1C1E] w-[90px] text-right">
                                  {emp.role}
                                </div>
                              </div>
                            ))
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-[55px] right-[55px] flex justify-between items-center bg-white z-10 shrink-0">
                  <button onClick={() => setStep(3)} className="text-[#007AFF] font-bold text-[16px] hover:text-[#0062CC] transition-colors">Back</button>
                  {errorLine && <p className="text-[#FF3B30] text-[13px] font-semibold text-center absolute left-1/2 -translate-x-1/2">{errorLine}</p>}
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="h-[52px] px-10 bg-[#007AFF] hover:bg-[#0062CC] rounded-[14px] text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {loading ? "Launching Phase..." : "Complete Setup"} 
                    {!loading && <CheckCircle2 className="h-5 w-5" />}
                  </button>
              </div>
            </div>
          )}
`;

fs.writeFileSync(path, beforeBlock + '\n' + middleBlock + '\n' + afterBlock);
console.log("File reconstructed safely!");
