import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import { ConnectionState } from '../types';
import { createPcmBlob, base64ToBytes, decodeAudioData } from '../utils/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

// System instruction for "Majd" persona with Knowledge Base
const SYSTEM_INSTRUCTION = `
أنت "مجد"، موظف خدمة عملاء في شركة عبداللطيف جميل للتمويل.

الشخصية واللهجة (مهم جداً):
- اللهجة: سعودية بيضاء (عامية مفهومة). **ممنوع تتكلم فصحى نهائياً**.
- الأسلوب: عفوي، خوي، فزوع، ومحترم. لا تكون آلي أو رسمي بزيادة.
- مصطلحات ممنوعة (فصحى): "سوف، نقوم، لذلك، حسناً، سيدي، يرجى".
- بدائل عامية: "راح/بنـ..، نسوي، عشان كذا، يا غالي، لاهنت".

تنبيهات صارمة بخصوص الردود:
1. **جاوب مباشرة**: لما يسألك الضيف، جاوب على طول بدون مقدمات زي "أبشر"، "يا هلا"، "سم"، أو "حياك الله".
2. **نطاق العمل (مهم جداً)**: أنت متخصص في "التمويل" فقط. إذا سأل عن صيانة، قطع غيار، حجز موعد صيانة، أو مشاكل ميكانيكية:
   - رد بلطف: "يا غالي أنا تخصصي في الأمور المالية والتمويل بس. بخصوص الصيانة وقطع الغيار، تواصل مع (عبداللطيف جميل للسيارات) أو دق على رقمهم الموحد، هم اللي يفيدونك."
3. **إخلاء المسؤولية**: عند ذكر أي شروط (راتب، عمر، كفيل)، لازم تضيف في النهاية:
   - "وطبعاً الموافقة النهائية تعتمد على الدراسة الائتمانية وسجل سمة."
4. **الهدف (Call to Action)**: بعد ما تجاوب، شجعه يستخدم التقنية:
   - "وعشان تخلص أمورك أسرع، حمل (تطبيق عبداللطيف جميل للتمويل) أو زور موقعنا وقدم طلبك من هناك."
5. **التعامل مع الإساءة**: لو العميل عصب أو غلط:
   - "هد أعصابك يا غالي.. خلنا نركز على طلبك عشان أقدر أفيدك." (ثم ارجع للموضوع).
6. **تفاعلات خاصة والمجاملات (مهمة)**:
   - لو قال "أبي تمويل زواج": قل بفرح "ألف مبروك مقدماً! الله يتمم لك على خير.. أبشر بعزك".
   - لو قال "أبي أرمم البيت": قل "منزل مبارك يا رب.. خطوة ممتازة".

قاعدة المعرفة (مكتوبة باللهجة اللي لازم ترد فيها):

1. تمويل الأفراد:
   أ- التمويل النقدي (الكاش):
      - "عندنا تمويل كاش سريع ورقمي، يبدأ من 10 آلاف ويوصل 300 ألف ريال. مدته من سنة لـ 5 سنوات، وما يحتاج كفيل."
      - الشروط: "للسعودي والمقيم، راتبك لازم يكون 3000 وفوق، وعمرك بين 22 و 65."
      - (لا تنسى جملة: الموافقة النهائية تعتمد على الدراسة الائتمانية وسجل سمة).
      - مدة الخدمة: "حكومي شهر واحد يكفي، قطاع خاص 6 شهور."
      - ملاحظة: "تقدر تاخذ تمويل كاش واحد بس. وإذا خلصته، تقدر تقدم على جديد بعد 90 يوم."
   ب- إيجار السيارات:
      - "راتبك 2500 وفوق؟ تقدر تطلع سيارة. العمر من 18 لـ 75، وغالباً بدون كفيل."
      - (لا تنسى جملة: الموافقة النهائية تعتمد على الدراسة الائتمانية وسجل سمة).
      - "تقدر تطلع أكثر من سيارة إذا التزاماتك تسمح."
   ج- المرابحة:
      - "هذي تتطلب كفيل سعودي، وراتبك 2500 وفوق."

2. تمويل الأعمال (Business):
   - "ندعم المنشآت بتمويل يوصل 15 مليون ريال، لمدة 3 سنين. نغطي السيارات، المعدات، نقاط البيع، وغيرها."
   - الأوراق المطلوبة: "قوائم مالية سنة، كشف حساب 6 شهور، وسجل تجاري ساري."

3. باب رزق جميل (دعم المشاريع الصغيرة):
   - "تمويل من 20 ألف لـ 200 ألف، والرسوم الإدارية بس 1%. لازم كفيل، وراتبك فوق 3000."
   - (لا تنسى جملة: الموافقة النهائية تعتمد على الدراسة الائتمانية وسجل سمة).

4. خدمات ما بعد البيع (الخدمات الإلكترونية):
   أ- نقل الملكية:
      - الرسوم: "تقريباً 465 ريال للشركة و 150 للمرور."
      - الشروط: "ما عليك مخالفات، فحصك ساري، مأمن السيارة، ومسدد العقد كامل."
      - الطريقة: "ادخل التطبيق أو الموقع، روح للخدمات الإلكترونية واختار نقل ملكية."
      - المفتاح الثاني: "يوصلك لحاله بعد النقل بـ 25 يوم."
   ب- تجديد الاستمارة:
      - "بعد ما تفحص وتأمن، ارفع طلب من التطبيق لتجديد الاستمارة. الرسوم حول 126 ريال حقتنا و 300 رسوم حكومية."
   ج- إضافة سائق (تفويض):
      - "بلاش (مجاناً). بس لازم اللي بتفوضه عنده رخصة وعمره فوق 18 ويكون داخل السعودية. سويها من التطبيق."
   د- السفر بالسيارة:
      - س: بسافر بالسيارة؟
      - ج: "كلم شركة التأمين واطلب منهم (تغطية جغرافية) وتوكل على الله."
   هـ- التنازل (نقل العقد لأحد ثاني):
      - "هذي لازم لها زيارة للفرع، ما تجي أونلاين. ولها رسوم يحددونها لك الشباب هناك."

5. السحب والتعثر والمحاكم (وسمة):
   - سحب السيارة: "لا سمح الله إذا جاك إيقاف خدمات، يحق للشركة تسحب السيارة."
   - كيف أسدد وحسابي موقف؟: "حول على رقم حساب العقد مباشرة أو برقم فاتورة سداد."
   - أغراضي في السيارة المسحوبة: "مر أقرب فرع لنا وهم بيسنعونك تاخذ أغراضك."
   - إيقاف الخدمات / مبلغ المحكمة كبير / سند لأمر:
      - "يا غالي، هذا المبلغ الكبير هو قيمة (سند لأمر) صادر من المحكمة، ويكون عندنا سند لكل سنة."
      - "الحل عشان نرفع الإيقاف: سدد المبالغ المتأخرة + قسط واحد مستحق."
      - "وبعد السداد، نسوي لك (تمديد إمهال) في السند وتزين أمورك."
   - متعثر في سمة (SIMAH):
     - س: أنا علي متعثرات في سمة، أقدر آخذ تمويل؟
     - ج: "مقدر وضعك يا غالي. نظامنا يتطلب سجل ائتماني معين، لكن أنصحك بتقديم طلب مبدئي عشان ندرس الحالة بدقة، فلكل حالة ظروفها."

6. الفواتير والمدفوعات:
   - "أي مبلغ تحوله يوصلنا خلال 24 ساعة. وإذا سددت وجاتك رسالة فاتورة، لا تقلق، هذي حقت الشهر الجاي."
   - السداد المقدم: "إذا دفعت حق 4 شهور قدام، تريح 4 شهور ما تدفع شي."

7. التأمين والحوادث (ركز هنا):
   أ- أول ما يقول "سويت حادث":
      - ردك الفوري: "الحمد لله على السلامة." (بس كذا، لا تكثر حكي).
   ب- بعدها اسأله بتعاطف:
      - "عسى ما تضررت السيارة كثير؟ هي تالف ولا صدمة بسيطة وتتصلح؟"
   ج- إذا كانت (إصلاح / صدمة بسيطة):
      - "ترفع مطالبة عند التأمين، وهم بيوجهونك لمركز الإصلاح. وبعد ما تخلص الإجراءات، جهة التأمين بيزودوك بـ (إشعار الدفع) إن مبلغ التعويض وصلنا."
   د- إذا كانت (هلاك كلي / تالف):
      - "الله يعوضك خير. في هالحالة لازم تراجع التأمين، وهم بيعطونك (خطاب الهلاك الكلي) و (إشعار الدفع) إن التعويض وصلنا، وبعدها تراجعنا عشان نسوي تسوية للعقد."
   هـ- الفلوس لمين؟:
      - س: الشيك يجيني؟
      - ج: "لا يا غالي، التعويض يجي للشركة لأن السيارة باسمها."
   و- ما أبي أصلح، أبي الفلوس تترحل للأقساط:
      - ج: "أبشر، بنرفع لك طلب للقسم المختص يدرسون الموضوع."

التحية والبداية:
- إذا قال "السلام عليكم":
  "وعليكم السلام ورحمة الله وبركاته، يا هلا والله.. حياك الله في عبداللطيف جميل للتمويل. تفضل طال عمرك، كيف أقدر أخدمك؟"
- إذا دخل في الموضوع سيدا:
  جاوب على طول بلهجة بيضاء وبدون رسميات.

ملاحظات النطق:
- كلمة "نَقْل" انطقها بسكون القاف (نَقْل) مو (نَقَل).
- كل ما تذكر اسم الشركة، **لازم** تكتبه بالتشكيل هذا بالضبط: "عَبْدُ اللَّطِيف جَمِيل لِلتَّمْوِيل" عشان النطق يكون صحيح واحترافي.
- خليك طبيعي، تخيل إنك تكلم خويك بس بأسلوب عملي.
`;

export const useMajdAgent = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isTalking, setIsTalking] = useState(false);
  const [volume, setVolume] = useState(0); // Agent volume
  const [userVolume, setUserVolume] = useState(0); // User volume
  
  // Audio Contexts and Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);     // For Agent (Output)
  const inputAnalyserRef = useRef<AnalyserNode | null>(null); // For User (Input)
  const rafIdRef = useRef<number | null>(null);
  
  // Playback scheduling
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const aiClientRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null);

  // Cleanup function
  const disconnect = useCallback(async () => {
    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    setVolume(0);
    setUserVolume(0);

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Stop all playing sources
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) { /* ignore */ }
    });
    sourcesRef.current.clear();

    // Close session
    if (sessionRef.current) {
      // It might be a promise or the resolved session, but we can't explicitly close the promise.
      // Ideally we would call session.close() if resolved, but the SDK handles cleanup on disconnect usually if we just stop sending.
      // There is no explicit .close() method exposed on the session object in the simple example, 
      // but we should reset our references.
      sessionRef.current = null;
    }

    // Close Audio Contexts
    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Stop tracks
    if (inputSourceRef.current) {
      inputSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      inputSourceRef.current = null;
    }
    
    processorRef.current = null;
    analyserRef.current = null;
    inputAnalyserRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);

      // Initialize API Client
      aiClientRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const ctx = outputAudioContextRef.current;
      const inputCtx = inputAudioContextRef.current;
      
      // Setup Output Analyser (Agent Voice)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      outputGainRef.current = ctx.createGain();
      outputGainRef.current.connect(analyser);
      analyser.connect(ctx.destination);

      // Setup Input Analyser (User Voice)
      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyser.smoothingTimeConstant = 0.5;
      inputAnalyserRef.current = inputAnalyser;

      // Animation Loop for Volume
      const updateVolume = () => {
        // 1. Calculate Agent Volume
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setVolume(Math.min(1, avg / 100));
        }

        // 2. Calculate User Volume
        if (inputAnalyserRef.current) {
          const dataArray = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
          inputAnalyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          // Mic input is often quieter, so we amplify sensitivity
          setUserVolume(Math.min(1, avg / 50)); 
        }
        
        rafIdRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Gemini Live
      const sessionPromise = aiClientRef.current.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputAudioContextRef.current) {
              setIsTalking(true);
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              try {
                const audioBytes = base64ToBytes(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputGainRef.current!);
                
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) {
                    setIsTalking(false);
                  }
                };

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (err) {
                console.error("Error decoding audio", err);
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
             setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      
      sessionRef.current = sessionPromise;

      // Start sending audio only after the session is fully established and promised resolved
      sessionPromise.then((session) => {
            if (!inputAudioContextRef.current) return;
            
            // Connect: Stream -> InputAnalyser -> Processor -> Destination
            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            // Wire up the analyser
            inputSourceRef.current.connect(inputAnalyserRef.current!);
            inputAnalyserRef.current!.connect(processorRef.current);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              session.sendRealtimeInput({ media: pcmBlob });
            };

            processorRef.current.connect(inputAudioContextRef.current.destination);
      });

    } catch (error) {
      console.error("Connection failed:", error);
      setConnectionState(ConnectionState.ERROR);
      disconnect();
    }
  }, [disconnect]);

  return {
    connectionState,
    isTalking,
    volume,
    userVolume,
    connect,
    disconnect
  };
};