import { Host, ModalBottomSheet, RNHostView } from '@expo/ui/jetpack-compose';
import type { LoginSheetProps } from './LoginSheet';
export default function LoginSheet({ isPresented, onDismiss, children }: LoginSheetProps) { if (!isPresented) return null; return <Host style={{ position: 'absolute' }}><ModalBottomSheet skipPartiallyExpanded showDragHandle containerColor="#1A1612" contentColor="#F7F1E9" onDismissRequest={onDismiss}><RNHostView>{children}</RNHostView></ModalBottomSheet></Host>; }
