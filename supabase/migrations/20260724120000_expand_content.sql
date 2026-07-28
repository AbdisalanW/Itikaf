-- Expands the starter content set (9 -> 26 verses/hadith). Every citation
-- below was checked against sunnah.com (hadith) or the Quran Uthmani-script
-- API (verses) before insertion — see chat/commit history for the exact
-- lookups. Still: have a knowledgeable reviewer (imam/scholar) check theme
-- tagging and translations before this is relied on at scale, same caveat
-- as the original seed set.
--
-- Motivated by two real gaps: "immigration-family" had zero matching items
-- at all, and "faith-doubt"/"gratitude"/"marriage"/"anger" each had exactly
-- one possible match — meaning every entry tagged that way surfaced the
-- identical item regardless of nuance.

insert into content_items (type, arabic_text, translation, source, theme_tags) values

('verse', 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ',
  'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.',
  'Quran 2:153', '{anxiety,workplace}'),

('verse', 'وَلَنَبْلُوَنَّكُم بِشَىْءٍ مِّنَ ٱلْخَوْفِ وَٱلْجُوعِ وَنَقْصٍ مِّنَ ٱلْأَمْوَٰلِ وَٱلْأَنفُسِ وَٱلثَّمَرَٰتِ ۗ وَبَشِّرِ ٱلصَّٰبِرِينَ',
  'And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient.',
  'Quran 2:155', '{financial-stress,anxiety,grief}'),

('verse', 'ٱلَّذِينَ إِذَآ أَصَٰبَتْهُم مُّصِيبَةٌ قَالُوٓا۟ إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ',
  'Who, when disaster strikes them, say, "Indeed we belong to Allah, and indeed to Him we will return."',
  'Quran 2:156', '{grief}'),

('verse', 'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ',
  'And when My servants ask you concerning Me — indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.',
  'Quran 2:186', '{faith-doubt,loneliness}'),

('verse', 'ٱلَّذِينَ قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ قَدْ جَمَعُوا۟ لَكُمْ فَٱخْشَوْهُمْ فَزَادَهُمْ إِيمَٰنًا وَقَالُوا۟ حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ',
  'Those to whom hypocrites said, "The people have gathered against you, so fear them." But it only increased them in faith, and they said, "Sufficient for us is Allah, and He is the best Disposer of affairs."',
  'Quran 3:173', '{anxiety,loneliness}'),

('verse', 'وَمَن يُهَاجِرْ فِى سَبِيلِ ٱللَّهِ يَجِدْ فِى ٱلْأَرْضِ مُرَٰغَمًا كَثِيرًا وَسَعَةً',
  'And whoever emigrates for the cause of Allah will find on the earth many locations and abundance.',
  'Quran 4:100', '{immigration-family,loneliness}'),

('verse', 'فَإِن تَوَلَّوْا۟ فَقُلْ حَسْبِىَ ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ',
  'But if they turn away, say, "Sufficient for me is Allah; there is no deity except Him. On Him I have relied."',
  'Quran 9:129', '{anxiety,financial-stress}'),

('verse', 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
  'And [remember] when your Lord proclaimed: "If you are grateful, I will surely increase you [in favor]."',
  'Quran 14:7', '{gratitude}'),

('verse', 'وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  'And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy.',
  'Quran 30:21', '{marriage}'),

('hadith', 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ وَلَا هَمٍّ وَلَا حُزْنٍ وَلَا أَذًى وَلَا غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلَّا كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ',
  'No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick of a thorn, but that Allah expiates some of his sins for that.',
  'Sahih al-Bukhari 5641', '{grief,anxiety}'),

('hadith', 'لَا تَغْضَبْ',
  'A man asked the Prophet, peace be upon him, "Advise me." He said, "Do not become angry." The man repeated his request several times, and each time the Prophet said, "Do not become angry."',
  'Sahih al-Bukhari 6116', '{anger}'),

('hadith', 'خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي',
  'The best of you is the best of you to his wife/family, and I am the best of you to my family.',
  'Jami at-Tirmidhi 3895', '{marriage}'),

('hadith', 'مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ',
  'Whoever relieves a believer of one of the distresses of this world, Allah will relieve him of one of the distresses of the Day of Resurrection.',
  'Sahih Muslim 2699', '{financial-stress,grief}'),

('hadith', 'لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ، وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ',
  'Wealth is not in having many possessions, but rather (true) wealth is feeling sufficiency in the soul.',
  'Sahih al-Bukhari 6446', '{financial-stress}'),

('hadith', 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَصِلْ رَحِمَهُ',
  'Whoever believes in Allah and the Last Day should maintain ties of kinship.',
  'Sahih al-Bukhari 6138', '{immigration-family}'),

('hadith', 'التَّاجِرُ الصَّدُوقُ الْأَمِينُ مَعَ النَّبِيِّينَ وَالصِّدِّيقِينَ وَالشُّهَدَاءِ',
  'The truthful, trustworthy merchant will be with the prophets, the truthful, and the martyrs.',
  'Jami at-Tirmidhi 1209', '{workplace}'),

('hadith', 'مَنْ لَا يَشْكُرُ النَّاسَ لَا يَشْكُرُ اللَّهَ',
  'Whoever does not thank people does not thank Allah.',
  'Jami at-Tirmidhi 1954', '{gratitude}');
