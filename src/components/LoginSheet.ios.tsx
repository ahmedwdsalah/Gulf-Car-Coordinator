import { BottomSheet, Group, Host, RNHostView } from '@expo/ui/swift-ui';
import { presentationBackground, presentationDetents, presentationDragIndicator } from '@expo/ui/swift-ui/modifiers';
import type { LoginSheetProps } from './LoginSheet';
export default function LoginSheet({ isPresented, onDismiss, children }: LoginSheetProps) { return <Host style={{ position: 'absolute' }}><BottomSheet isPresented={isPresented} onIsPresentedChange={(presented) => !presented && onDismiss()}><Group modifiers={[presentationDetents(['large']), presentationBackground('#1A1612'), presentationDragIndicator('visible')]}><RNHostView>{children}</RNHostView></Group></BottomSheet></Host>; }
