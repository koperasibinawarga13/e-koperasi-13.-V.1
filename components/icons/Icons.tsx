import React from 'react';

const IconWrapper: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    {props.children}
  </svg>
);

export const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapper {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </IconWrapper>
);

export const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </IconWrapper>
);

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 01-3 5.197" />
  </IconWrapper>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </IconWrapper>
);

export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </IconWrapper>
);

export const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </IconWrapper>
);

export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconWrapper>
);

export const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </IconWrapper>
);

export const CalculatorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-6m-3 6v-6m-3 6v-6m-3 6h12M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </IconWrapper>
);

export const BuildingOfficeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </IconWrapper>
);

export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </IconWrapper>
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </IconWrapper>
);

export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </IconWrapper>
);

export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </IconWrapper>
);

export const PrintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm2-9V5a2 2 0 012-2h2a2 2 0 012 2v3m-4 5a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v1" />
  </IconWrapper>
);

export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </IconWrapper>
);

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </IconWrapper>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </IconWrapper>
);

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconWrapper>
);

export const EyeSlashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
  </IconWrapper>
);

export const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.94a1 1 0 01.7.7l.2 1.34a1 1 0 00.7 1.34l1.34.2a1 1 0 01.7.7l-.2 1.34a1 1 0 00-.7 1.34l-1.34.2a1 1 0 01-.7.7l.2-1.34a1 1 0 00-.7-1.34l-1.34-.2a1 1 0 01-.7-.7l-.2-1.34a1 1 0 00.7-1.34l1.34-.2a1 1 0 01.7-.7zM19.07 4.93a1 1 0 01.7.7l.2 1.34a1 1 0 00.7 1.34l1.34.2a1 1 0 01.7.7l-.2 1.34a1 1 0 00-.7 1.34l-1.34.2a1 1 0 01-.7.7l.2-1.34a1 1 0 00-.7-1.34l-1.34-.2a1 1 0 01-.7-.7l-.2-1.34a1 1 0 00.7-1.34l1.34-.2a1 1 0 01.7-.7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10a4 4 0 11-8 0 4 4 0 018 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
    </IconWrapper>
);

export const SwitchHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </IconWrapper>
);

export const CashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </IconWrapper>
);

export const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </IconWrapper>
);


// Icons for Rich Text Editor
const IconWrapperSmall: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    {props.children}
  </svg>
);

export const BoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapperSmall {...props} strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h5a4 4 0 014 4 4 4 0 01-4 4H8V4zm0 8h6a4 4 0 014 4 4 4 0 01-4 4H8v-8z" />
    </IconWrapperSmall>
);

export const ItalicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapperSmall {...props} strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h6m-6 16h6M12 4L8 20" />
    </IconWrapperSmall>
);

export const UnderlineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapperSmall {...props} strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v7a6 6 0 006 6 6 6 0 006-6V4M4 20h16" />
    </IconWrapperSmall>
);

export const ListBulletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapperSmall {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h.01M2 12h.01M2 18h.01" />
    </IconWrapperSmall>
);

export const ListOrderedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapperSmall {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h12M8 18h12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6V5m0 7v-1m-1 7V17.5" />
    </IconWrapperSmall>
);

export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <IconWrapperSmall {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </IconWrapperSmall>
);