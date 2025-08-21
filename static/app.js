/**
 * Chinese Learning App - Frontend Application
 * 
 * This app provides comprehensible input/output learning for Chinese language.
 * Features:
 * - Study mode: View Chinese text, pinyin, literal and English translations
 * - Audio playback for pronunciation practice
 * - Practice mode: Listen and write pinyin or Chinese characters
 * - Visual feedback and progress tracking
 */

class ChineseLearningApp {
    constructor() {
        this.lessons = [];
        this.currentLessonIndex = 0;
        this.currentLesson = null;
        this.completedLessons = new Set();
        this.currentAudio = null;
        
        // DOM elements
        this.elements = {
            // Progress
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            // Lesson selector
            lessonSelect: document.getElementById('lessonSelect'),
            
            // Study mode
            studyMode: document.getElementById('studyMode'),
            lessonNumber: document.getElementById('lessonNumber'),
            chineseText: document.getElementById('chineseText'),
            pinyinText: document.getElementById('pinyinText'),
            literalText: document.getElementById('literalText'),
            englishText: document.getElementById('englishText'),
            frenchText: document.getElementById('frenchText'),
            frenchRow: document.getElementById('frenchRow'),
            playAudioBtn: document.getElementById('playAudioBtn'),
            repeatAudioBtn: document.getElementById('repeatAudioBtn'),
            playFrenchBtn: document.getElementById('playFrenchBtn'),
            startPracticeBtn: document.getElementById('startPracticeBtn'),
            prevLessonBtn: document.getElementById('prevLessonBtn'),
            nextLessonBtn: document.getElementById('nextLessonBtn'),
            
            // Practice mode
            practiceMode: document.getElementById('practiceMode'),
            practicePlayBtn: document.getElementById('practicePlayBtn'),
            audioStatus: document.getElementById('audioStatus'),
            practicePinyin: document.getElementById('practicePinyin'),
            practiceChinese: document.getElementById('practiceChinese'),
            practiceAnswer: document.getElementById('practiceAnswer'),
            checkAnswerBtn: document.getElementById('checkAnswerBtn'),
            feedbackArea: document.getElementById('feedbackArea'),
            showAnswerBtn: document.getElementById('showAnswerBtn'),
            nextPracticeBtn: document.getElementById('nextPracticeBtn'),
            backToStudyBtn: document.getElementById('backToStudyBtn'),
            
            // Stats
            completedCount: document.getElementById('completedCount'),
            totalCount: document.getElementById('totalCount')
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.loadLessons();
            this.populateLessonSelector();
            this.setupEventListeners();
            this.showLesson(0);
            this.updateStats();
            console.log('✅ Chinese Learning App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to load lesson data. Please check if the data file exists.');
        }
    }
    
    async loadLessons() {
        try {
            // Try to load from the generated JSON file
            const response = await fetch('../data/lessons.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.lessons = data.lessons;
            this.elements.totalCount.textContent = data.total_lessons;
            
            console.log(`✅ Loaded ${this.lessons.length} lessons`);
        } catch (error) {
            console.warn('⚠️ Could not load lessons.json, using sample data');
            // Fallback to sample data for testing
            this.lessons = this.getSampleLessons();
            this.elements.totalCount.textContent = this.lessons.length;
        }
    }
    
    getSampleLessons() {
        // Sample data for testing when lessons.json is not available
        return [
            {
                id: 1,
                chinese: "我叫James，我是英国人。",
                pinyin: "Wǒ jiào James, wǒ shì Yīngguó rén.",
                literal: "I called James, I am England person.",
                english: "My name is James, I am British.",
                audio_file: "lesson_01.mp3"
            },
            {
                id: 2,
                chinese: "我是坐飞机来的上海。",
                pinyin: "Wǒ shì zuò fēijī lái de Shànghǎi.",
                literal: "I am sit airplane come [particle] Shanghai.",
                english: "I came to Shanghai by airplane.",
                audio_file: "lesson_02.mp3"
            },
            {
                id: 3,
                chinese: "我从今年二月开始在上海工作。",
                pinyin: "Wǒ cóng jīnnián èryuè kāishǐ zài Shànghǎi gōngzuò.",
                literal: "I from this-year February start at Shanghai work.",
                english: "I started working in Shanghai in February this year.",
                audio_file: "lesson_03.mp3"
            }
        ];
    }
    
    populateLessonSelector() {
        /**
         * Populate the lesson dropdown with all available lessons
         */
        if (!this.lessons || this.lessons.length === 0) return;
        
        // Clear existing options
        this.elements.lessonSelect.innerHTML = '';
        
        // Add all lessons to dropdown
        this.lessons.forEach((lesson, index) => {
            const option = document.createElement('option');
            option.value = index;
            
            // Create descriptive text: "[HSK2] Lesson 1: 我叫James..."
            const chinesePreview = lesson.chinese.length > 20 
                ? lesson.chinese.substring(0, 20) + '...'
                : lesson.chinese;
            
            const sourceLabel = lesson.source ? `[${lesson.source}] ` : '';
            option.textContent = `${sourceLabel}Lesson ${lesson.id}: ${chinesePreview}`;
            this.elements.lessonSelect.appendChild(option);
        });
        
        console.log(`✅ Populated lesson selector with ${this.lessons.length} lessons`);
    }
    
    setupEventListeners() {
        // Study mode controls
        this.elements.playAudioBtn.addEventListener('click', () => this.playAudio());
        this.elements.repeatAudioBtn.addEventListener('click', () => this.playAudio());
        this.elements.playFrenchBtn.addEventListener('click', () => this.playFrenchAudio());
        this.elements.startPracticeBtn.addEventListener('click', () => this.enterPracticeMode());
        this.elements.prevLessonBtn.addEventListener('click', () => this.previousLesson());
        this.elements.nextLessonBtn.addEventListener('click', () => this.nextLesson());
        
        // Lesson selector
        this.elements.lessonSelect.addEventListener('change', (e) => {
            const selectedIndex = parseInt(e.target.value);
            this.showLesson(selectedIndex);
        });
        
        // Practice mode controls
        this.elements.practicePlayBtn.addEventListener('click', () => this.playPracticeAudio());
        this.elements.checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        this.elements.showAnswerBtn.addEventListener('click', () => this.showAnswer());
        this.elements.nextPracticeBtn.addEventListener('click', () => this.nextPracticeLesson());
        this.elements.backToStudyBtn.addEventListener('click', () => this.exitPracticeMode());
        
        // Practice input handling
        this.elements.practiceAnswer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.checkAnswer();
            }
        });
        
        // Practice type change
        this.elements.practicePinyin.addEventListener('change', () => this.resetPractice());
        this.elements.practiceChinese.addEventListener('change', () => this.resetPractice());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    showLesson(index) {
        if (index < 0 || index >= this.lessons.length) return;
        
        this.currentLessonIndex = index;
        this.currentLesson = this.lessons[index];
        
        // Update lesson display
        const sourceLabel = this.currentLesson.source ? `[${this.currentLesson.source}] ` : '';
        this.elements.lessonNumber.textContent = `${sourceLabel}Lesson ${this.currentLesson.id}`;
        this.elements.chineseText.textContent = this.currentLesson.chinese;
        this.elements.pinyinText.textContent = this.currentLesson.pinyin;
        this.elements.literalText.textContent = this.currentLesson.literal;
        this.elements.englishText.textContent = this.currentLesson.english;
        
        // Handle French content
        if (this.currentLesson.french) {
            this.elements.frenchText.textContent = this.currentLesson.french;
            this.elements.frenchRow.style.display = 'flex';
            this.elements.playFrenchBtn.style.display = 'inline-block';
        } else {
            this.elements.frenchRow.style.display = 'none';
            this.elements.playFrenchBtn.style.display = 'none';
        }
        
        // Update progress
        const progress = ((index + 1) / this.lessons.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `Lesson ${index + 1} of ${this.lessons.length}`;
        
        // Update lesson selector
        this.elements.lessonSelect.value = index;
        
        // Update navigation buttons
        this.elements.prevLessonBtn.disabled = index === 0;
        this.elements.nextLessonBtn.disabled = index === this.lessons.length - 1;
        
        // Add fade-in effect
        this.elements.studyMode.classList.add('fade-in');
        setTimeout(() => this.elements.studyMode.classList.remove('fade-in'), 300);
    }
    
    async playAudio() {
        if (!this.currentLesson) return;
        
        const audioFile = `../audio/${this.currentLesson.audio_file}`;
        
        console.log('🎵 Attempting to play audio:', audioFile);
        console.log('📂 Current lesson:', this.currentLesson);
        
        try {
            // Stop current audio if playing
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            // Create new audio instance
            this.currentAudio = new Audio(audioFile);
            console.log('✅ Audio object created');
            
            // Add detailed error handling
            this.currentAudio.addEventListener('error', (e) => {
                console.error('❌ Audio error event:', e);
                console.error('❌ Audio error details:', this.currentAudio.error);
                this.handleAudioError(`Audio failed to load: ${this.currentAudio.error?.message || 'Unknown error'}`);
            });
            
            this.currentAudio.addEventListener('loadstart', () => {
                console.log('🔄 Audio loading started');
            });
            
            this.currentAudio.addEventListener('canplay', () => {
                console.log('✅ Audio can play');
            });
            
            // Add visual feedback
            this.elements.playAudioBtn.classList.add('audio-playing');
            this.elements.playAudioBtn.textContent = 'Loading...';
            this.elements.playAudioBtn.disabled = true;
            
            // Test if file exists first
            const response = await fetch(audioFile, { method: 'HEAD' });
            console.log('📁 Audio file check response:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Audio file not found: ${response.status} ${response.statusText}`);
            }
            
            // Update button text when starting to play
            this.elements.playAudioBtn.textContent = 'Playing...';
            
            // Play audio
            console.log('▶️ Starting audio playback');
            await this.currentAudio.play();
            console.log('✅ Audio playing successfully');
            
            // Handle audio end
            this.currentAudio.addEventListener('ended', () => {
                console.log('🏁 Audio playback ended');
                this.elements.playAudioBtn.classList.remove('audio-playing');
                this.elements.playAudioBtn.textContent = 'Play Chinese';
                this.elements.playAudioBtn.disabled = false;
            });
            
        } catch (error) {
            console.error('❌ Audio playback failed:', error);
            console.error('❌ Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            this.handleAudioError(error.message);
        }
    }
    
    handleAudioError(errorMessage) {
        console.log('🛠️ Handling audio error:', errorMessage);
        
        this.elements.playAudioBtn.classList.remove('audio-playing');
        this.elements.playAudioBtn.textContent = 'Audio Error';
        this.elements.playAudioBtn.disabled = false;
        
        // Show detailed error message
        this.showNotification(`Audio Error: ${errorMessage}. Check browser console for details.`);
        
        // Reset button after a delay
        setTimeout(() => {
            this.elements.playAudioBtn.textContent = 'Play Chinese';
        }, 3000);
    }
    
    async playFrenchAudio() {
        if (!this.currentLesson || !this.currentLesson.french_audio_file) {
            this.showNotification('No French audio available for this lesson.');
            return;
        }
        
        const audioFile = `../audio/${this.currentLesson.french_audio_file}`;
        
        console.log('🎵 Attempting to play French audio:', audioFile);
        
        try {
            // Stop current audio if playing
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            // Create new audio instance
            this.currentAudio = new Audio(audioFile);
            
            // Add visual feedback
            this.elements.playFrenchBtn.classList.add('audio-playing');
            this.elements.playFrenchBtn.textContent = 'Loading...';
            this.elements.playFrenchBtn.disabled = true;
            
            // Test if file exists first
            const response = await fetch(audioFile, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`French audio file not found: ${response.status} ${response.statusText}`);
            }
            
            // Update button text when starting to play
            this.elements.playFrenchBtn.textContent = 'Playing...';
            
            // Play audio
            await this.currentAudio.play();
            
            // Handle audio end
            this.currentAudio.addEventListener('ended', () => {
                this.elements.playFrenchBtn.classList.remove('audio-playing');
                this.elements.playFrenchBtn.textContent = 'Play French';
                this.elements.playFrenchBtn.disabled = false;
            });
            
        } catch (error) {
            console.error('❌ French audio playback failed:', error);
            this.elements.playFrenchBtn.classList.remove('audio-playing');
            this.elements.playFrenchBtn.textContent = 'French Audio Error';
            this.elements.playFrenchBtn.disabled = false;
            
            this.showNotification(`French Audio Error: ${error.message}`);
            
            // Reset button after a delay
            setTimeout(() => {
                this.elements.playFrenchBtn.textContent = 'Play French';
            }, 3000);
        }
    }

    async playPracticeAudio() {
        this.elements.audioStatus.textContent = 'Playing audio...';
        await this.playAudio();
        this.elements.audioStatus.textContent = 'Audio played. Now write what you heard.';
    }
    
    previousLesson() {
        if (this.currentLessonIndex > 0) {
            this.showLesson(this.currentLessonIndex - 1);
        }
    }
    
    nextLesson() {
        if (this.currentLessonIndex < this.lessons.length - 1) {
            this.showLesson(this.currentLessonIndex + 1);
        }
    }
    
    enterPracticeMode() {
        this.elements.studyMode.classList.add('hidden');
        this.elements.practiceMode.classList.remove('hidden');
        this.resetPractice();
    }
    
    exitPracticeMode() {
        this.elements.practiceMode.classList.add('hidden');
        this.elements.studyMode.classList.remove('hidden');
    }
    
    resetPractice() {
        this.elements.practiceAnswer.value = '';
        this.elements.practiceAnswer.className = '';
        this.elements.feedbackArea.innerHTML = '';
        this.elements.feedbackArea.className = 'feedback-area';
        this.elements.checkAnswerBtn.classList.remove('hidden');
        this.elements.nextPracticeBtn.classList.add('hidden');
        this.elements.audioStatus.textContent = 'Click to play audio';
    }
    
    checkAnswer() {
        const userAnswer = this.elements.practiceAnswer.value.trim();
        if (!userAnswer) {
            this.showNotification('Please enter your answer first.');
            return;
        }
        
        const practiceType = this.elements.practicePinyin.checked ? 'pinyin' : 'chinese';
        const correctAnswer = practiceType === 'pinyin' 
            ? this.currentLesson.pinyin 
            : this.currentLesson.chinese;
        
        const isCorrect = this.compareAnswers(userAnswer, correctAnswer);
        
        if (isCorrect) {
            this.showCorrectFeedback();
            this.completedLessons.add(this.currentLesson.id);
            this.updateStats();
        } else {
            this.showIncorrectFeedback(userAnswer, correctAnswer);
        }
    }
    
    compareAnswers(userAnswer, correctAnswer) {
        // Normalize both answers for comparison
        const normalize = (text) => text
            .toLowerCase()
            .replace(/[.,，。！？!?]/g, '')  // Remove punctuation
            .replace(/\s+/g, ' ')          // Normalize spaces
            .trim();
        
        return normalize(userAnswer) === normalize(correctAnswer);
    }
    
    showCorrectFeedback() {
        this.elements.feedbackArea.className = 'feedback-area feedback-correct';
        this.elements.feedbackArea.innerHTML = `
            <strong>✅ Correct!</strong><br>
            Well done! You got it right.
        `;
        
        this.elements.practiceAnswer.className = 'correct';
        this.elements.checkAnswerBtn.classList.add('hidden');
        this.elements.nextPracticeBtn.classList.remove('hidden');
    }
    
    showIncorrectFeedback(userAnswer, correctAnswer) {
        this.elements.feedbackArea.className = 'feedback-area feedback-incorrect';
        this.elements.feedbackArea.innerHTML = `
            <strong>❌ Not quite right</strong><br>
            <div class="feedback-comparison">
                Your answer: <span class="user-answer">${userAnswer}</span><br>
                Correct answer: <span class="correct-answer">${correctAnswer}</span>
            </div>
            <br><em>Try again or click "Show Answer" to see the correct response.</em>
        `;
        
        this.elements.practiceAnswer.className = 'incorrect';
    }
    
    showAnswer() {
        const practiceType = this.elements.practicePinyin.checked ? 'pinyin' : 'chinese';
        const correctAnswer = practiceType === 'pinyin' 
            ? this.currentLesson.pinyin 
            : this.currentLesson.chinese;
        
        this.elements.practiceAnswer.value = correctAnswer;
        this.elements.practiceAnswer.className = 'correct';
        
        this.elements.feedbackArea.className = 'feedback-area feedback-correct';
        this.elements.feedbackArea.innerHTML = `
            <strong>💡 Answer shown</strong><br>
            The correct answer is: <strong>${correctAnswer}</strong><br>
            <em>Study this and try the next lesson!</em>
        `;
        
        this.elements.checkAnswerBtn.classList.add('hidden');
        this.elements.nextPracticeBtn.classList.remove('hidden');
    }
    
    nextPracticeLesson() {
        if (this.currentLessonIndex < this.lessons.length - 1) {
            this.showLesson(this.currentLessonIndex + 1);
            this.resetPractice();
        } else {
            this.showNotification('🎉 Congratulations! You\'ve completed all lessons!');
            this.exitPracticeMode();
        }
    }
    
    updateStats() {
        this.elements.completedCount.textContent = this.completedLessons.size;
    }
    
    handleKeyboard(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousLesson();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextLesson();
                break;
            case ' ':
                e.preventDefault();
                this.playAudio();
                break;
            case 'p':
                e.preventDefault();
                this.enterPracticeMode();
                break;
            case 'Escape':
                e.preventDefault();
                this.exitPracticeMode();
                break;
        }
    }
    
    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    showError(message) {
        this.elements.studyMode.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #d32f2f;">
                <h2>❌ Error</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chineseLearningApp = new ChineseLearningApp();
});

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('✅ Service worker registered'))
            .catch(() => console.log('⚠️ Service worker registration failed'));
    });
}