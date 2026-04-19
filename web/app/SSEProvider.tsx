"use client";

import { getAlarmStatus, subscribeAlarms } from "@/lib/api/notifications";
import { useAlaramStore } from "@/stores/useAlaramStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ReactNode, useEffect } from "react";

interface Props {
  children: ReactNode;
}

export default function SSEProvider({ children }: Props) {
    const { isLogin } = useAuthStore();
  
    const { setAlarms, addAlarm, setAlarmCount } = useAlaramStore();

    
    useEffect(() => {
      if(!isLogin) return;
      
      // 알람 sse 연결
      const alaram = subscribeAlarms();
      alaram.addEventListener("CONNECTED", (event) => {
        console.log(event)
      }); 
  
      // 알람 추가
      alaram.addEventListener("NOTIFICATION_CREATED", (event) => {
        const data = JSON.parse(event.data);
        addAlarm(data);
      });
  
      alaram.onerror = () => {
        alaram.close();
      };
  

      // 알람 개수 가져오기
      const init = async () => {
        try {
          const data = await getAlarmStatus();
          setAlarmCount(data.newCount);

        } catch (e) {
          console.error("알림 개수 조회 실패", e);
        }
      };

      init();

      return () => {
        alaram.close();
      };   
    }, [isLogin]);

    return children;

}