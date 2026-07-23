-- Starter content set. Sourced from the Quran and widely authenticated hadith
-- collections (Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, at-Tirmidhi) —
-- not AI-generated. This is a small MVP seed; per earlier project discussion,
-- have a knowledgeable reviewer (imam/scholar) check this set and its theme
-- tagging before real users see it, and expand well beyond this starter list.

insert into content_items (type, arabic_text, translation, source, theme_tags) values
('verse', 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
  'Allah does not burden a soul beyond what it can bear.',
  'Quran 2:286', '{anxiety,financial-stress,workplace}'),

('verse', 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾',
  'Indeed, with hardship comes ease. Indeed, with hardship comes ease.',
  'Quran 94:5-6', '{anxiety,grief,financial-stress}'),

('verse', 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  'Verily, in the remembrance of Allah do hearts find rest.',
  'Quran 13:28', '{anxiety,loneliness}'),

('verse', 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
  'And whoever relies upon Allah — then He is sufficient for him.',
  'Quran 65:3', '{financial-stress,anxiety,workplace}'),

('verse', 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
  'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.',
  'Quran 39:53', '{faith-doubt,grief}'),

('hadith', 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ',
  'How wonderful is the affair of the believer — all of it is good for him.',
  'Sahih Muslim 2999', '{gratitude,grief}'),

('hadith', 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
  'The strong one is not the one who overcomes people through strength, but the one who controls himself in anger.',
  'Sahih al-Bukhari 6114', '{anger,workplace,marriage}'),

('dua', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ',
  'O Allah, I seek refuge in You from anxiety and grief, incapacity and laziness, miserliness and cowardice.',
  'Sahih al-Bukhari 6369', '{anxiety,grief,workplace}'),

('dua', 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
  'O Allah, there is no ease except in what You have made easy, and You make hardship easy if You will.',
  'Ibn Hibban (Hisnul Muslim)', '{workplace,financial-stress,anxiety}'),

('istighfar', 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
  'I seek forgiveness from Allah the Mighty, besides whom there is none worthy of worship, the Ever-Living, the Sustainer, and I turn to Him in repentance.',
  'Sunan Abi Dawud, at-Tirmidhi', '{}'),

('istighfar', 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
  'My Lord, forgive me and accept my repentance, for You are the Accepting of Repentance, the Merciful.',
  'Sunan Abi Dawud 1516', '{}'),

('istighfar', 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ',
  'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I hold to Your covenant and promise as best I can — the master of seeking forgiveness (Sayyid al-Istighfar).',
  'Sahih al-Bukhari 6306', '{}');
