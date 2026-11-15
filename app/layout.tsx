import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'CIMP Partners Studio',description:'The live display studio for Canadian International Matriculation Programme at Sunway College.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
