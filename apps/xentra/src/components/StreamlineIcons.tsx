import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function StreamlineHome({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}><path fill="none" d="M3 11.99v2.51c0 3.3 0 4.95 1.025 5.975S6.7 21.5 10 21.5h4c3.3 0 4.95 0 5.975-1.025S21 17.8 21 14.5v-2.51c0-1.682 0-2.522-.356-3.25s-1.02-1.244-2.346-2.276l-2-1.555C14.233 3.303 13.2 2.5 12 2.5s-2.233.803-4.298 2.409l-2 1.555C4.375 7.496 3.712 8.012 3.356 8.74S3 10.308 3 11.99"/><path fill="none" d="M15 17c-.8.622-1.85 1-3 1s-2.2-.378-3-1"/></g></svg>
  );
}

export function StreamlineEmployees({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M18.5 20.5c-.234-2.931-2.658-5.252-5.692-5.448L11.999 15q-.431.012-.811.03C8.18 15.172 5.73 17.597 5.5 20.5m9.75-11.25a3.25 3.25 0 1 1-6.5 0a3.25 3.25 0 0 1 6.5 0M5.502 8.5A3.25 3.25 0 0 1 9.5 3.752M18.496 8.5A3.25 3.25 0 0 0 14.5 3.752M22 18c-.18-2.263-2-4.5-4-5M2 18c.18-2.263 2-4.5 4-5"/></svg>
  );
}

export function StreamlineAttendance({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth={strokeWidth}><path fill="none" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"/><path fill="none" strokeLinecap="round" strokeLinejoin="round" d="M12.008 10.508a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m0 0V7m3.007 8.02l-1.949-1.948"/></g></svg>
  );
}

export function StreamlineTimesheet({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}><path fill="none" d="M16 2v4M8 2v4m5-2h-2C7.229 4 5.343 4 4.172 5.172S3 8.229 3 12v2c0 3.771 0 5.657 1.172 6.828S7.229 22 11 22h2c3.771 0 5.657 0 6.828-1.172S21 17.771 21 14v-2c0-3.771 0-5.657-1.172-6.828S16.771 4 13 4M3 10h18"/><path fill="none" d="M12.126 14H12m.125 4H12m-4.376-4H7.5m.125 4H7.5m9.125-4H16.5m-4.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m0 4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m-4.5-4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m0 4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m9-4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g></svg>
  );
}

export function StreamlineDepartments({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth={strokeWidth}><path fill="none" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 0H9c-1.886 0-2.828 0-3.414.586S5 14.114 5 16m7-4h3c1.886 0 2.828 0 3.414.586S19 14.114 19 16"/><path fill="none" d="M2 19c0-1.414 0-2.121.44-2.56C2.878 16 3.585 16 5 16s2.121 0 2.56.44C8 16.878 8 17.585 8 19s0 2.121-.44 2.56C7.122 22 6.415 22 5 22s-2.121 0-2.56-.44C2 21.122 2 20.415 2 19Zm14 0c0-1.414 0-2.121.44-2.56C16.878 16 17.585 16 19 16s2.121 0 2.56.44c.44.439.44 1.146.44 2.56s0 2.121-.44 2.56c-.439.44-1.146.44-2.56.44s-2.121 0-2.56-.44C16 21.122 16 20.415 16 19ZM10.286 2h3.428C15.79 2 16 3.11 16 5s-.211 3-2.286 3h-3.428C8.21 8 8 6.89 8 5s.211-3 2.286-3Z"/></g></svg>
  );
}

export function StreamlineExpiryAlerts({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}><path fill="none" d="M13.925 21h-3.85c-4.63 0-6.945 0-7.799-1.506c-.853-1.506.331-3.503 2.7-7.495L6.9 8.753C9.176 4.918 10.313 3 12 3s2.824 1.918 5.1 5.753L19.023 12c2.369 3.992 3.553 5.989 2.7 7.495C20.87 21 18.555 21 13.924 21M12 9v4"/><path fill="none" d="M12.125 16.75H12m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g></svg>
  );
}

export function StreamlineStorage({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={strokeWidth} d="M8 7h8.75c2.107 0 3.16 0 3.917.506a3 3 0 0 1 .827.827C22 9.09 22 10.143 22 12.25c0 3.511 0 5.267-.843 6.528a5 5 0 0 1-1.38 1.38C18.518 21 16.762 21 13.25 21H12c-4.714 0-7.071 0-8.536-1.465C2 18.072 2 15.715 2 11V7.944c0-1.816 0-2.724.38-3.406A3 3 0 0 1 3.538 3.38C4.22 3 5.128 3 6.944 3C8.108 3 8.69 3 9.2 3.191c1.163.436 1.643 1.493 2.168 2.542L12 7"/></svg>
  );
}

export function StreamlineNotifications({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={strokeWidth}><path fill="none" strokeLinecap="round" d="M19 18V9.5a7 7 0 1 0-14 0V18m15.5 0h-17"/><path fill="none" d="M13.5 20a1.5 1.5 0 0 1-1.5 1.5M10.5 20a1.5 1.5 0 0 0 1.5 1.5m0 0V20"/></g></svg>
  );
}

export function StreamlineSettings({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth={strokeWidth}><path fill="none" d="M15.5 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z"/><path fill="none" strokeLinecap="round" d="M21.011 14.097c.522-.141.783-.212.886-.346c.103-.135.103-.351.103-.784v-1.934c0-.433 0-.65-.103-.784s-.364-.205-.886-.345c-1.95-.526-3.171-2.565-2.668-4.503c.139-.533.208-.8.142-.956s-.256-.264-.635-.479l-1.725-.98c-.372-.21-.558-.316-.725-.294s-.356.21-.733.587c-1.459 1.455-3.873 1.455-5.333 0c-.377-.376-.565-.564-.732-.587c-.167-.022-.353.083-.725.295l-1.725.979c-.38.215-.57.323-.635.48c-.066.155.003.422.141.955c.503 1.938-.718 3.977-2.669 4.503c-.522.14-.783.21-.886.345S2 10.6 2 11.033v1.934c0 .433 0 .65.103.784s.364.205.886.346c1.95.526 3.171 2.565 2.668 4.502c-.139.533-.208.8-.142.956s.256.264.635.48l1.725.978c.372.212.558.317.725.295s.356-.21.733-.587c1.46-1.457 3.876-1.457 5.336 0c.377.376.565.564.732.587c.167.022.353-.083.726-.295l1.724-.979c.38-.215.57-.323.635-.48s-.003-.422-.141-.955c-.504-1.937.716-3.976 2.666-4.502Z"/></g></svg>
  );
}

export function StreamlineSubscription({ size = 20, className = "", strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg className={className} {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}><path fill="none" d="M5 21h14m-6.875-8.25H12m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/><path fill="none" d="m14.915 7.61l-1.107-2.228C13.019 3.794 12.625 3 12 3s-1.019.794-1.808 2.382L9.085 7.61C8.58 8.625 8.329 9.132 7.88 9.246a1 1 0 0 1-.095.02c-.458.07-.886-.3-1.741-1.037C4.012 6.476 2.997 5.6 2.38 5.949a1 1 0 0 0-.114.076c-.564.43-.17 1.716.616 4.29l1.166 3.813c.423 1.384.635 2.076 1.17 2.474S6.473 17 7.91 17h8.178c1.438 0 2.158 0 2.693-.398s.747-1.09 1.17-2.474l1.166-3.813c.787-2.574 1.18-3.86.616-4.29a1 1 0 0 0-.114-.076c-.617-.349-1.632.527-3.664 2.28c-.855.738-1.283 1.107-1.741 1.036a1 1 0 0 1-.095-.019c-.45-.114-.701-.621-1.205-1.635"/></g></svg>
  );
}

