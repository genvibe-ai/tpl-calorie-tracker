import { forwardRef, type ComponentRef } from "react";
import type { ScrollViewProps } from "react-native";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";

/**
 * iOS and Android: the chat's scroll view. The list viewport stays fixed and
 * native content insets follow the keyboard, so nothing jumps behind the
 * composer. The web build uses ChatScroll.web.tsx.
 */
export const ChatScroll = forwardRef<ComponentRef<typeof KeyboardChatScrollView>, ScrollViewProps>(
  function ChatScroll(props, ref) {
    return (
      <KeyboardChatScrollView
        {...props}
        ref={ref}
        keyboardLiftBehavior="whenAtEnd"
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
      />
    );
  },
);
