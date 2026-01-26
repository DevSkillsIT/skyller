 "use client";

 import { CopilotSidebar } from "@copilotkitnext/react";

 /**
  * Lite Chat - UI padrão do CopilotKit em rota dedicada.
  *
  * Mantém uma base de referência para comparar com o chat customizado.
  */
 export default function LiteChatPage() {
   return (
     <div className="min-h-screen bg-background px-6 py-10">
       <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
         <h1 className="text-2xl font-semibold text-foreground">Lite Chat</h1>
         <p className="text-sm text-muted-foreground">
           Esta página expõe o chat padrão do CopilotKit como base de comparação. Útil para
           validação de comportamento e UX antes de levar melhorias para o chat customizado.
         </p>
       </div>

       <CopilotSidebar
         defaultOpen={true}
         labels={{
           modalHeaderTitle: "Skyller AI Assistant",
           chatInputPlaceholder: "Como posso ajudar você hoje?",
         }}
       />
     </div>
   );
 }
