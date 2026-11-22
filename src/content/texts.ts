/**
 * Banque de textes prêts à l'emploi (sans IA, sans attente).
 * Deux réserves séparées : les textes de dictée et les textes de recopie ne se croisent pas.
 */
import type { Lang } from "@/lib/languages";

export type BankSentence = { text: string; translation: string; translit?: string };
export type BankText = { id: string; title: string; sentences: BankSentence[] };

type Pools = { dictation: BankText[]; copy: BankText[] };

const s = (text: string, translation: string, translit?: string): BankSentence => ({ text, translation, translit });

export const TEXT_BANK: Record<Lang, Pools> = {
  en: {
    dictation: [
      {
        id: "en-d1",
        title: "A new start",
        sentences: [
          s("Last year, Sara moved to a small town near the sea.", "L'année dernière, Sara a déménagé dans une petite ville près de la mer."),
          s("She found an old apartment above a bakery.", "Elle a trouvé un vieil appartement au-dessus d'une boulangerie."),
          s("Every morning, the smell of fresh bread woke her up.", "Chaque matin, l'odeur du pain frais la réveillait."),
          s("At first, she did not know anyone in the town.", "Au début, elle ne connaissait personne dans la ville."),
          s("Then she started to talk with the baker, a kind old man named Tom.", "Puis elle a commencé à parler avec le boulanger, un vieil homme gentil nommé Tom."),
          s("He told her stories about the town and its people.", "Il lui racontait des histoires sur la ville et ses habitants."),
          s("Today, Sara has many friends, and she never wants to leave.", "Aujourd'hui, Sara a beaucoup d'amis et ne veut plus jamais partir."),
        ],
      },
      {
        id: "en-d2",
        title: "The meeting",
        sentences: [
          s("The meeting started at nine o'clock sharp.", "La réunion a commencé à neuf heures précises."),
          s("Our manager presented the results of the last quarter.", "Notre responsable a présenté les résultats du dernier trimestre."),
          s("Sales were higher than expected, especially online.", "Les ventes ont été plus élevées que prévu, surtout en ligne."),
          s("However, our costs also increased a lot.", "Cependant, nos coûts ont aussi beaucoup augmenté."),
          s("We decided to look for cheaper suppliers before the summer.", "Nous avons décidé de chercher des fournisseurs moins chers avant l'été."),
          s("Everyone agreed to send their ideas by Friday.", "Tout le monde a accepté d'envoyer ses idées d'ici vendredi."),
          s("After the meeting, we went for lunch together.", "Après la réunion, nous sommes allés déjeuner ensemble."),
        ],
      },
      {
        id: "en-d3",
        title: "Buying a house",
        sentences: [
          s("Buying a house is one of the biggest decisions in life.", "Acheter une maison est l'une des plus grandes décisions de la vie."),
          s("First, you need to know how much the bank can lend you.", "D'abord, il faut savoir combien la banque peut te prêter."),
          s("Then, you should visit many properties before choosing one.", "Ensuite, tu devrais visiter beaucoup de biens avant d'en choisir un."),
          s("Always check the condition of the roof and the windows.", "Vérifie toujours l'état du toit et des fenêtres."),
          s("Ask the neighbours about the area and the noise at night.", "Interroge les voisins sur le quartier et le bruit la nuit."),
          s("If the price is too high, do not be afraid to negotiate.", "Si le prix est trop élevé, n'aie pas peur de négocier."),
          s("A good deal is one that fits both your budget and your plans.", "Une bonne affaire est celle qui convient à ton budget et à tes projets."),
        ],
      },
    ],
    copy: [
      {
        id: "en-c1",
        title: "The market",
        sentences: [
          s("On Saturday mornings, the market is full of life.", "Le samedi matin, le marché est plein de vie."),
          s("Farmers sell fruit, vegetables and fresh eggs.", "Les agriculteurs vendent des fruits, des légumes et des œufs frais."),
          s("Children run between the stalls while their parents shop.", "Les enfants courent entre les étals pendant que leurs parents font les courses."),
          s("A musician plays the guitar near the fountain.", "Un musicien joue de la guitare près de la fontaine."),
          s("I always buy mangoes from the same old woman.", "J'achète toujours mes mangues à la même vieille dame."),
          s("She remembers my name and keeps the best ones for me.", "Elle se souvient de mon nom et me garde les meilleures."),
          s("For me, the market is the heart of the city.", "Pour moi, le marché est le cœur de la ville."),
        ],
      },
      {
        id: "en-c2",
        title: "Learning online",
        sentences: [
          s("Today, you can learn almost anything on the internet.", "Aujourd'hui, on peut apprendre presque tout sur internet."),
          s("Free videos explain mathematics, history and even cooking.", "Des vidéos gratuites expliquent les maths, l'histoire et même la cuisine."),
          s("But learning alone is not always easy.", "Mais apprendre seul n'est pas toujours facile."),
          s("You need discipline, a clear goal and a little patience.", "Il faut de la discipline, un objectif clair et un peu de patience."),
          s("The best method is to practise a little every day.", "La meilleure méthode est de pratiquer un peu chaque jour."),
          s("Small steps, repeated often, lead to big results.", "De petits pas, répétés souvent, mènent à de grands résultats."),
        ],
      },
      {
        id: "en-c3",
        title: "The match",
        sentences: [
          s("The stadium was full long before the start of the match.", "Le stade était plein bien avant le début du match."),
          s("Thousands of fans sang and waved their flags.", "Des milliers de supporters chantaient et agitaient leurs drapeaux."),
          s("In the first half, neither team managed to score.", "En première mi-temps, aucune équipe n'a réussi à marquer."),
          s("Then, in the seventieth minute, our striker scored a beautiful goal.", "Puis, à la soixante-dixième minute, notre attaquant a marqué un très beau but."),
          s("The crowd exploded with joy.", "La foule a explosé de joie."),
          s("The other team attacked until the end, but we held on.", "L'autre équipe a attaqué jusqu'à la fin, mais nous avons tenu."),
          s("We walked home happy, singing all the way.", "Nous sommes rentrés heureux, en chantant tout le long du chemin."),
        ],
      },
    ],
  },
  es: {
    dictation: [
      {
        id: "es-d1",
        title: "Un nuevo comienzo",
        sentences: [
          s("El año pasado, Lucía se mudó a un pueblo pequeño cerca del mar.", "L'année dernière, Lucía a déménagé dans un petit village près de la mer."),
          s("Encontró un piso antiguo encima de una panadería.", "Elle a trouvé un vieil appartement au-dessus d'une boulangerie."),
          s("Cada mañana, el olor del pan recién hecho la despertaba.", "Chaque matin, l'odeur du pain tout juste cuit la réveillait."),
          s("Al principio, no conocía a nadie en el pueblo.", "Au début, elle ne connaissait personne au village."),
          s("Después empezó a hablar con el panadero, un señor mayor muy amable.", "Puis elle a commencé à parler avec le boulanger, un monsieur âgé très aimable."),
          s("Él le contaba historias sobre el pueblo y su gente.", "Il lui racontait des histoires sur le village et ses habitants."),
          s("Hoy Lucía tiene muchos amigos y no quiere irse nunca.", "Aujourd'hui Lucía a beaucoup d'amis et ne veut jamais partir."),
        ],
      },
      {
        id: "es-d2",
        title: "La reunión",
        sentences: [
          s("La reunión empezó a las nueve en punto.", "La réunion a commencé à neuf heures pile."),
          s("Nuestra jefa presentó los resultados del último trimestre.", "Notre cheffe a présenté les résultats du dernier trimestre."),
          s("Las ventas fueron más altas de lo esperado, sobre todo en internet.", "Les ventes ont été plus élevées que prévu, surtout sur internet."),
          s("Sin embargo, los gastos también subieron mucho.", "Cependant, les dépenses ont aussi beaucoup augmenté."),
          s("Decidimos buscar proveedores más baratos antes del verano.", "Nous avons décidé de chercher des fournisseurs moins chers avant l'été."),
          s("Todos aceptaron enviar sus ideas antes del viernes.", "Tout le monde a accepté d'envoyer ses idées avant vendredi."),
          s("Después de la reunión, fuimos a comer juntos.", "Après la réunion, nous sommes allés manger ensemble."),
        ],
      },
      {
        id: "es-d3",
        title: "Comprar una casa",
        sentences: [
          s("Comprar una casa es una de las decisiones más importantes de la vida.", "Acheter une maison est l'une des décisions les plus importantes de la vie."),
          s("Primero, hay que saber cuánto dinero te puede prestar el banco.", "D'abord, il faut savoir combien d'argent la banque peut te prêter."),
          s("Luego, conviene visitar muchas viviendas antes de elegir.", "Ensuite, il vaut mieux visiter beaucoup de logements avant de choisir."),
          s("Revisa siempre el estado del tejado y de las ventanas.", "Vérifie toujours l'état du toit et des fenêtres."),
          s("Pregunta a los vecinos por el barrio y el ruido por la noche.", "Interroge les voisins sur le quartier et le bruit la nuit."),
          s("Si el precio es demasiado alto, no tengas miedo de negociar.", "Si le prix est trop élevé, n'aie pas peur de négocier."),
          s("Un buen trato es el que se adapta a tu presupuesto.", "Une bonne affaire est celle qui s'adapte à ton budget."),
        ],
      },
    ],
    copy: [
      {
        id: "es-c1",
        title: "El mercado",
        sentences: [
          s("Los sábados por la mañana, el mercado está lleno de vida.", "Le samedi matin, le marché est plein de vie."),
          s("Los agricultores venden fruta, verduras y huevos frescos.", "Les agriculteurs vendent des fruits, des légumes et des œufs frais."),
          s("Los niños corren entre los puestos mientras sus padres compran.", "Les enfants courent entre les étals pendant que leurs parents achètent."),
          s("Un músico toca la guitarra cerca de la fuente.", "Un musicien joue de la guitare près de la fontaine."),
          s("Siempre compro los mangos a la misma señora.", "J'achète toujours les mangues à la même dame."),
          s("Ella recuerda mi nombre y me guarda los mejores.", "Elle se souvient de mon nom et me garde les meilleures."),
          s("Para mí, el mercado es el corazón de la ciudad.", "Pour moi, le marché est le cœur de la ville."),
        ],
      },
      {
        id: "es-c2",
        title: "Aprender por internet",
        sentences: [
          s("Hoy en día se puede aprender casi todo por internet.", "De nos jours, on peut apprendre presque tout sur internet."),
          s("Hay vídeos gratuitos de matemáticas, historia e incluso cocina.", "Il y a des vidéos gratuites de maths, d'histoire et même de cuisine."),
          s("Pero aprender solo no siempre es fácil.", "Mais apprendre seul n'est pas toujours facile."),
          s("Hace falta disciplina, un objetivo claro y un poco de paciencia.", "Il faut de la discipline, un objectif clair et un peu de patience."),
          s("El mejor método es practicar un poco cada día.", "La meilleure méthode est de pratiquer un peu chaque jour."),
          s("Los pequeños pasos, repetidos a menudo, dan grandes resultados.", "Les petits pas, répétés souvent, donnent de grands résultats."),
        ],
      },
      {
        id: "es-c3",
        title: "El partido",
        sentences: [
          s("El estadio estaba lleno mucho antes del comienzo del partido.", "Le stade était plein bien avant le début du match."),
          s("Miles de aficionados cantaban y agitaban sus banderas.", "Des milliers de supporters chantaient et agitaient leurs drapeaux."),
          s("En la primera parte, ningún equipo consiguió marcar.", "En première mi-temps, aucune équipe n'a réussi à marquer."),
          s("Luego, en el minuto setenta, nuestro delantero marcó un gol precioso.", "Puis, à la soixante-dixième minute, notre attaquant a marqué un but magnifique."),
          s("El público explotó de alegría.", "Le public a explosé de joie."),
          s("El otro equipo atacó hasta el final, pero aguantamos.", "L'autre équipe a attaqué jusqu'à la fin, mais nous avons tenu."),
          s("Volvimos a casa felices, cantando todo el camino.", "Nous sommes rentrés heureux, en chantant tout le chemin."),
        ],
      },
    ],
  },
  ar: {
    dictation: [
      {
        id: "ar-d1",
        title: "في السوق",
        sentences: [
          s("أذهب إلى السوق كل يوم سبت.", "Je vais au marché chaque samedi.", "adhhabu ilā al-sūqi kulla yawmi sabt."),
          s("في السوق فواكه وخضار كثيرة.", "Au marché, il y a beaucoup de fruits et de légumes.", "fī al-sūqi fawākihu wa-khuḍārun kathīra."),
          s("أشتري الخبز والحليب والتمر.", "J'achète du pain, du lait et des dattes.", "ashtarī al-khubza wa-al-ḥalība wa-al-tamr."),
          s("البائع رجل لطيف يعرف اسمي.", "Le vendeur est un homme gentil qui connaît mon nom.", "al-bāʾiʿu rajulun laṭīfun yaʿrifu ismī."),
          s("أسأله: بكم هذا التفاح؟", "Je lui demande : combien coûtent ces pommes ?", "asʾaluhu: bikam hādhā al-tuffāḥ?"),
          s("يقول: بعشرة دراهم.", "Il dit : dix dirhams.", "yaqūlu: bi-ʿasharati darāhim."),
          s("أدفع وأشكره ثم أرجع إلى البيت.", "Je paie, je le remercie, puis je rentre à la maison.", "adfaʿu wa-ashkuruhu thumma arjiʿu ilā al-bayt."),
        ],
      },
      {
        id: "ar-d2",
        title: "عائلتي",
        sentences: [
          s("اسمي يوسف وأسكن في مدينة كبيرة.", "Je m'appelle Youssef et j'habite dans une grande ville.", "ismī yūsuf wa-askunu fī madīnatin kabīra."),
          s("عندي أخ واحد وأختان.", "J'ai un frère et deux sœurs.", "ʿindī akhun wāḥidun wa-ukhtān."),
          s("أبي يعمل في شركة وأمي معلمة.", "Mon père travaille dans une entreprise et ma mère est enseignante.", "abī yaʿmalu fī sharikatin wa-ummī muʿallima."),
          s("أخي الصغير يحب كرة القدم كثيرا.", "Mon petit frère aime beaucoup le football.", "akhī al-ṣaghīru yuḥibbu kurata al-qadami kathīran."),
          s("في المساء نأكل العشاء معا.", "Le soir, nous dînons ensemble.", "fī al-masāʾi naʾkulu al-ʿashāʾa maʿan."),
          s("بعد العشاء نشرب الشاي ونتكلم.", "Après le dîner, nous buvons du thé et nous parlons.", "baʿda al-ʿashāʾi nashrabu al-shāya wa-natakallam."),
          s("أحب عائلتي كثيرا.", "J'aime beaucoup ma famille.", "uḥibbu ʿāʾilatī kathīran."),
        ],
      },
      {
        id: "ar-d3",
        title: "شقة جديدة",
        sentences: [
          s("أبحث عن شقة جديدة قريبة من عملي.", "Je cherche un nouvel appartement près de mon travail.", "abḥathu ʿan shaqqatin jadīdatin qarībatin min ʿamalī."),
          s("أريد شقة فيها غرفتان ومطبخ كبير.", "Je veux un appartement avec deux chambres et une grande cuisine.", "urīdu shaqqatan fīhā ghurfatāni wa-maṭbakhun kabīr."),
          s("زرت اليوم شقة جميلة في وسط المدينة.", "Aujourd'hui, j'ai visité un bel appartement au centre-ville.", "zurtu al-yawma shaqqatan jamīlatan fī wasaṭi al-madīna."),
          s("الإيجار ثلاثة آلاف درهم في الشهر.", "Le loyer est de trois mille dirhams par mois.", "al-ījāru thalāthatu ālāfi dirhamin fī al-shahr."),
          s("السعر مرتفع قليلا لكن الشقة نظيفة.", "Le prix est un peu élevé, mais l'appartement est propre.", "al-siʿru murtafiʿun qalīlan lākinna al-shaqqata naẓīfa."),
          s("سأفكر وأتصل بالمالك غدا.", "Je vais réfléchir et j'appellerai le propriétaire demain.", "sa-ufakkiru wa-attaṣilu bi-al-māliki ghadan."),
        ],
      },
    ],
    copy: [
      {
        id: "ar-c1",
        title: "يومي",
        sentences: [
          s("أستيقظ كل يوم في الساعة السادسة.", "Je me réveille chaque jour à six heures.", "astayqiẓu kulla yawmin fī al-sāʿati al-sādisa."),
          s("أشرب القهوة وآكل الفطور.", "Je bois du café et je prends le petit-déjeuner.", "ashrabu al-qahwata wa-ākulu al-fuṭūr."),
          s("ثم أذهب إلى العمل بالحافلة.", "Puis je vais au travail en bus.", "thumma adhhabu ilā al-ʿamali bi-al-ḥāfila."),
          s("أعمل من التاسعة حتى الخامسة.", "Je travaille de neuf heures à cinq heures.", "aʿmalu min al-tāsiʿati ḥattā al-khāmisa."),
          s("في المساء أقرأ كتابا أو أشاهد فيلما.", "Le soir, je lis un livre ou je regarde un film.", "fī al-masāʾi aqraʾu kitāban aw ushāhidu fīlman."),
          s("أنام في الساعة الحادية عشرة.", "Je me couche à onze heures.", "anāmu fī al-sāʿati al-ḥādiyata ʿashra."),
        ],
      },
      {
        id: "ar-c2",
        title: "السفر",
        sentences: [
          s("أحب السفر كثيرا.", "J'aime beaucoup voyager.", "uḥibbu al-safara kathīran."),
          s("في الصيف الماضي سافرت إلى المغرب.", "L'été dernier, je suis allé au Maroc.", "fī al-ṣayfi al-māḍī sāfartu ilā al-maghrib."),
          s("زرت مدينة مراكش ومدينة فاس.", "J'ai visité Marrakech et Fès.", "zurtu madīnata marrākush wa-madīnata fās."),
          s("أكلت الطاجين وشربت الشاي بالنعناع.", "J'ai mangé du tajine et bu du thé à la menthe.", "akaltu al-ṭājīna wa-sharibtu al-shāya bi-al-naʿnāʿ."),
          s("الناس هناك كرماء جدا.", "Là-bas, les gens sont très généreux.", "al-nāsu hunāka kuramāʾu jiddan."),
          s("أريد أن أرجع إلى هناك في السنة القادمة.", "Je veux y retourner l'année prochaine.", "urīdu an arjiʿa ilā hunāka fī al-sanati al-qādima."),
        ],
      },
      {
        id: "ar-c3",
        title: "التعلم",
        sentences: [
          s("تعلم لغة جديدة يحتاج إلى صبر.", "Apprendre une nouvelle langue demande de la patience.", "taʿallumu lughatin jadīdatin yaḥtāju ilā ṣabr."),
          s("يجب أن أدرس كل يوم قليلا.", "Je dois étudier un peu chaque jour.", "yajibu an adrusa kulla yawmin qalīlan."),
          s("أستمع إلى الأخبار وأقرأ القصص القصيرة.", "J'écoute les informations et je lis des nouvelles.", "astamiʿu ilā al-akhbāri wa-aqraʾu al-qiṣaṣa al-qaṣīra."),
          s("أكتب الكلمات الجديدة في دفتر.", "J'écris les nouveaux mots dans un cahier.", "aktubu al-kalimāti al-jadīdata fī daftar."),
          s("أتكلم مع أصدقائي باللغة العربية.", "Je parle avec mes amis en arabe.", "atakallamu maʿa aṣdiqāʾī bi-al-lughati al-ʿarabiyya."),
          s("كل يوم أفهم أكثر من قبل.", "Chaque jour, je comprends mieux qu'avant.", "kulla yawmin afhamu akthara min qabl."),
        ],
      },
    ],
  },
  fr: {
    dictation: [
      {
        id: "fr-d1",
        title: "Le déménagement",
        sentences: [
          s("Lorsque nous sommes arrivés dans notre nouvel appartement, les cartons s'entassaient partout.", "Piège : « arrivés » s'accorde avec le sujet (être)."),
          s("Les meubles que nous avions commandés n'étaient pas encore livrés.", "Piège : « commandés » s'accorde avec « que » mis pour « meubles », placé avant."),
          s("Ma sœur, qui était venue nous aider, s'est mise à ranger la cuisine.", "Pièges : « venue » et « mise » au féminin."),
          s("Quant à moi, j'ai passé la soirée à monter des étagères.", "Piège : « quant à » (et non « quand à »)."),
          s("Malgré la fatigue, nous étions heureux d'avoir enfin un chez-nous.", "Piège : « chez-nous » nom, avec un trait d'union."),
          s("Les voisins, très accueillants, nous ont apporté un gâteau.", "Piège : « apporté » ne s'accorde pas (COD après)."),
          s("Ce soir-là, nous nous sommes endormis sur un matelas posé à même le sol.", "Pièges : « soir-là », « endormis », « à même »."),
        ],
      },
      {
        id: "fr-d2",
        title: "L'entretien",
        sentences: [
          s("Hier matin, j'ai passé l'entretien que j'attendais depuis des semaines.", "Imparfait pour une action qui dure dans le passé."),
          s("La recruteuse m'a posé des questions précises sur mon parcours.", "Piège : « posé » invariable (COD après)."),
          s("Je lui ai expliqué quels projets j'avais menés et quelles difficultés j'avais surmontées.", "Pièges : « quels/quelles » et participes accordés avec le COD placé avant."),
          s("Bien qu'elle ait paru convaincue, elle ne m'a rien promis.", "Piège : « bien que » + subjonctif."),
          s("Elle m'a assuré qu'on me recontacterait avant la fin du mois.", "Piège : conditionnel « -rait » (futur dans le passé)."),
          s("En sortant, je me suis rendu compte que j'avais oublié mon parapluie.", "Piège : « rendu compte » toujours invariable."),
          s("Quoi qu'il arrive, cette expérience m'aura beaucoup appris.", "Piège : « quoi que » en deux mots."),
        ],
      },
      {
        id: "fr-d3",
        title: "Investir",
        sentences: [
          s("Avant d'investir dans l'immobilier, il faut que vous connaissiez bien le marché.", "Piège : « il faut que » + subjonctif (connaissiez)."),
          s("Les quartiers où la demande est forte offrent souvent les meilleurs rendements.", "Piège : « où » (lieu) avec accent."),
          s("Néanmoins, les prix y sont plus élevés et la concurrence plus rude.", "Piège : « y » et l'accord de « élevés »."),
          s("Certains investisseurs préfèrent acheter des biens anciens qu'ils rénovent eux-mêmes.", "Piège : « eux-mêmes » avec trait d'union et s."),
          s("Ces travaux, s'ils sont bien menés, peuvent augmenter considérablement la valeur du bien.", "Piège : « ces » démonstratif, « menés » accordé."),
          s("Encore faut-il avoir prévu un budget suffisant pour les imprévus.", "Piège : inversion après « encore »."),
        ],
      },
    ],
    copy: [
      {
        id: "fr-c1",
        title: "Une lettre formelle",
        sentences: [
          s("Madame, Monsieur, je me permets de vous écrire à la suite de notre échange téléphonique de mardi dernier.", "« À la suite de » plutôt que « suite à »."),
          s("Comme convenu, vous trouverez ci-joint les documents que vous m'aviez demandés.", "« Ci-joint » invariable en tête de phrase ou devant un nom sans article."),
          s("Je reste à votre disposition pour tout renseignement complémentaire.", "Formule de disponibilité."),
          s("Je vous remercie de l'attention que vous porterez à ma demande.", "Futur : « porterez »."),
          s("Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.", "Formule de politesse finale."),
        ],
      },
      {
        id: "fr-c2",
        title: "La ville la nuit",
        sentences: [
          s("La nuit tombait doucement sur la ville.", "Imparfait de description."),
          s("Les lampadaires s'allumaient les uns après les autres.", "Verbe pronominal à l'imparfait."),
          s("Dans les rues encore animées, les vendeurs rangeaient leurs étals.", "« Étals », pluriel de « étal »."),
          s("Une odeur de grillades flottait près du marché.", ""),
          s("Des enfants couraient en riant derrière un ballon.", "« Courir » prend deux r au futur, un seul à l'imparfait."),
          s("Peu à peu, le bruit laissait place au silence.", ""),
        ],
      },
      {
        id: "fr-c3",
        title: "Le temps",
        sentences: [
          s("On dit souvent que le temps, c'est de l'argent.", ""),
          s("Pourtant, le temps est bien plus précieux que l'argent.", ""),
          s("L'argent perdu peut se regagner, le temps perdu jamais.", ""),
          s("C'est pourquoi il vaut mieux choisir avec soin ses priorités.", "« Ses » possessif (les siennes)."),
          s("Chaque heure consacrée à apprendre est un investissement pour l'avenir.", "« Consacrée » accordé avec « heure »."),
          s("Ceux qui l'ont compris avancent plus vite que les autres.", ""),
        ],
      },
    ],
  },
};

const HISTORY_KEY = "polyglotte:texts-done";

function readHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Tire un texte au hasard, en évitant ceux déjà faits (on recommence quand tout a été vu). */
export function pickBankText(lang: Lang, pool: keyof Pools): BankText {
  const texts = TEXT_BANK[lang][pool];
  const done = new Set(readHistory());
  const fresh = texts.filter((t) => !done.has(t.id));
  const choices = fresh.length ? fresh : texts;
  const picked = choices[Math.floor(Math.random() * choices.length)];
  try {
    const prefix = `${lang}-${pool === "copy" ? "c" : "d"}`;
    const history = readHistory();
    // Tout a été vu : on remet cette réserve à zéro.
    const base = fresh.length ? history : history.filter((id) => !id.startsWith(prefix));
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...base.filter((id) => id !== picked.id), picked.id].slice(-60)));
  } catch {
    /* stockage indisponible */
  }
  return picked;
}

/** Titres des textes IA déjà faits, pour demander autre chose la fois suivante. */
const AI_TITLES_KEY = "polyglotte:ai-text-titles";

export function recentAiTitles(): string[] {
  try {
    return JSON.parse(localStorage.getItem(AI_TITLES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function rememberAiTitle(title: string) {
  try {
    localStorage.setItem(AI_TITLES_KEY, JSON.stringify([...recentAiTitles().filter((t) => t !== title), title].slice(-15)));
  } catch {
    /* stockage indisponible */
  }
}
