import React from 'react';
import { Bot, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage } from '../../types/chat';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const navigate = useNavigate();
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end space-y-1 mb-4">
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="bg-blue-50 text-blue-900 border border-blue-100 rounded-2xl rounded-br-none px-4 py-2.5 text-xs font-medium shadow-2xs">
            {message.text}
          </div>
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-[10px]">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
        <span className="text-[10px] text-slate-400 mr-8">{message.timestamp}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start space-y-1 mb-4">
      <div className="flex items-start gap-2 max-w-[92%]">
        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5" />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-700 shadow-2xs space-y-2.5">
          <p className="leading-relaxed font-normal">{message.text}</p>

          {/* Matched Fields list if duplicate or rule violation */}
          {message.matchedFields && message.matchedFields.length > 0 && (
            <div className="pt-1.5 border-t border-slate-200/60">
              <span className="font-bold text-slate-800 text-[11px] block mb-1">
                Matched Fields:
              </span>
              <ul className="space-y-1 text-slate-600">
                {message.matchedFields.map((field, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown counts list */}
          {message.breakdownList && message.breakdownList.length > 0 && (
            <div className="pt-1.5 border-t border-slate-200/60">
              <ul className="space-y-1 text-slate-600">
                {message.breakdownList.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="font-semibold text-slate-800">{item.count}</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Action Button */}
          {message.actionLabel && message.actionUrl && (
            <div className="pt-1">
              <button
                onClick={() => navigate(message.actionUrl!)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 font-semibold text-[11px] transition-colors shadow-2xs"
              >
                <span>{message.actionLabel}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      <span className="text-[10px] text-slate-400 ml-8">{message.timestamp}</span>
    </div>
  );
};
