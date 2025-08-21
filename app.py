#!/usr/bin/env python3
"""
Chinese Driving Test Light Commands - Streamlit App
Shanghai Subject 3 Simulated Night Driving Light Test
"""

import streamlit as st
import json
import os
from pathlib import Path
import subprocess
import random

st.set_page_config(
    page_title="Chinese Driving Test - Light Commands",
    page_icon="🚗",
    layout="wide"
)

@st.cache_data
def load_lessons():
    """Load lesson data from JSON file"""
    try:
        app_dir = Path(__file__).parent
        with open(app_dir / 'data/lessons.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['lessons']
    except FileNotFoundError:
        st.error("Lesson data not found. Please generate audio files first.")
        return []

def generate_lessons_data():
    """Generate lesson data and audio files"""
    if st.button("Generate Audio Files"):
        with st.spinner("Generating lesson data and audio files..."):
            try:
                # Run the audio generation script
                result = subprocess.run([
                    'python', 'src/generate_audio_edge.py', 'input/chinese-driving.md'
                ], capture_output=True, text=True, cwd='.')
                
                if result.returncode == 0:
                    st.success("Audio files generated successfully!")
                    st.rerun()
                else:
                    st.error(f"Error generating audio: {result.stderr}")
            except Exception as e:
                st.error(f"Error: {str(e)}")

def main():
    st.title("🚗 Chinese Driving Test - Light Commands")
    st.markdown("### 上海科目三模拟夜间灯光考试")
    st.markdown("**Shanghai Subject 3 Simulated Night Driving Light Test**")
    
    # Load lessons
    lessons = load_lessons()
    
    if not lessons:
        st.warning("No lesson data available.")
        generate_lessons_data()
        return
    
    # Test mode selector
    test_mode = st.selectbox("Select mode:", ["Study Mode", "Test Mode"])
    
    if test_mode == "Study Mode":
        # Initialize session state for selected index
        if 'selected_index' not in st.session_state:
            st.session_state.selected_index = 0
            
        # Navigation buttons
        col1, col2, col3 = st.columns([1, 2, 1])
        
        with col1:
            if st.session_state.selected_index > 0:
                if st.button("← Previous", key=f"prev_btn_{st.session_state.selected_index}", use_container_width=True):
                    st.session_state.selected_index -= 1
        
        with col2:
            current_lesson = lessons[st.session_state.selected_index] if lessons else None
            if current_lesson:
                st.markdown(f"<div style='text-align: center; padding-top: 8px;'>Lesson {st.session_state.selected_index + 1} of {len(lessons)}</div>", unsafe_allow_html=True)
        
        with col3:
            if st.session_state.selected_index < len(lessons) - 1:
                if st.button("Next →", key=f"next_btn_{st.session_state.selected_index}", use_container_width=True):
                    st.session_state.selected_index += 1
            
        st.markdown("---")
        
        # Optional lesson selector
        lesson_options = [f"[{lesson['id']}] {lesson['chinese'][:30]}..." for lesson in lessons]
        selected_index = st.selectbox("Jump to Lesson:", range(len(lessons)), 
                                    format_func=lambda x: lesson_options[x],
                                    index=st.session_state.selected_index,
                                    key="lesson_selector")
        
        # Update session state when selectbox changes
        if selected_index != st.session_state.selected_index:
            st.session_state.selected_index = selected_index
        
        # Use the session state index directly
        lesson = lessons[st.session_state.selected_index]
        
        # Display lesson content
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown(f"## Command {lesson['id']}")
            
            # Chinese command
            st.markdown(f"### 🎙️ Voice Command")
            st.markdown(f"<div style='font-size: 24px; color: #1f77b4; font-weight: bold; background-color: #f0f8ff; padding: 15px; border-radius: 8px;'>{lesson['chinese']}</div>", unsafe_allow_html=True)
            
            # Pinyin
            st.markdown(f"### Pinyin")
            st.markdown(f"<div style='font-size: 18px; color: #666; font-style: italic;'>{lesson['pinyin']}</div>", unsafe_allow_html=True)
            
            # English translation
            st.markdown(f"### English Translation")
            # Create proper English translations for each command
            english_translations = {
                1: "Please turn on the headlights",
                2: "Following a vehicle ahead at close range in the same direction",
                3: "Meeting oncoming motor vehicles",
                4: "Passing through traffic light controlled intersections",
                5: "Driving on well-lit roads with street lights",
                6: "Passing through sharp curves",
                "6a": "Passing through slopes",
                "6b": "Crossing arched bridges", 
                "6c": "Crossing pedestrian crosswalks",
                "6d": "Passing through uncontrolled intersections",
                7: "Overtaking the vehicle ahead",
                8: "Driving on unlit roads",
                "8a": "Driving on poorly lit roads",
                9: "Temporary roadside parking",
                10: "Please turn off all lights and start moving"
            }
            english_text = english_translations.get(lesson['id'], lesson['literal'])
            st.markdown(f"<div style='font-size: 16px; color: #555;'>{english_text}</div>", unsafe_allow_html=True)
            
            # Required action
            st.markdown(f"### 💡 Required Light Action")
            st.markdown(f"<div style='font-size: 18px; color: #d32f2f; font-weight: bold; background-color: #ffebee; padding: 12px; border-radius: 8px;'>{lesson['english']}</div>", unsafe_allow_html=True)
            
        with col2:
            st.markdown("### Audio")
            
            # Chinese audio
            app_dir = Path(__file__).parent
            audio_file = app_dir / f"audio/{lesson['audio_file']}"
            if audio_file.exists():
                with open(audio_file, 'rb') as f:
                    audio_bytes = f.read()
                st.audio(audio_bytes, format='audio/mp3')
                st.caption("🇨🇳 Official test command")
            else:
                st.warning("Audio file not found")
            
            # Command type
            st.markdown("### Command Type")
            if "前照灯" in lesson['chinese'] or "关闭" in lesson['chinese']:
                cmd_type = "Basic Light Control"
            elif "通过" in lesson['chinese']:
                cmd_type = "Passing Scenario"
            elif "超越" in lesson['chinese']:
                cmd_type = "Overtaking"
            elif "停车" in lesson['chinese']:
                cmd_type = "Parking"
            else:
                cmd_type = "Driving Scenario"
            
            st.markdown(f"<div style='background-color: #e8f5e8; padding: 8px; border-radius: 4px; text-align: center; color: #2e7d32;'>{cmd_type}</div>", unsafe_allow_html=True)
    
    else:  # Test Mode
        st.markdown("### 🎯 Practice Test")
        st.markdown("Listen to each command and select the correct light action.")
        
        if 'test_question' not in st.session_state:
            st.session_state.test_question = 0
            st.session_state.score = 0
            # Create randomized question order
            st.session_state.question_order = list(range(len(lessons)))
            random.shuffle(st.session_state.question_order)
        
        if st.session_state.test_question < len(lessons):
            # Get the lesson using the randomized order
            lesson_index = st.session_state.question_order[st.session_state.test_question]
            lesson = lessons[lesson_index]
            
            st.markdown(f"**Question {st.session_state.test_question + 1} of {len(lessons)}**")
            
            # Play audio
            app_dir = Path(__file__).parent
            audio_file = app_dir / f"audio/{lesson['audio_file']}"
            if audio_file.exists():
                with open(audio_file, 'rb') as f:
                    audio_bytes = f.read()
                st.audio(audio_bytes, format='audio/mp3')
            
            # Answer options (simplified for demo)
            options = ["Low beam", "High beam", "Alternating beams", "Turn signals + beams", "Width + alarm lights", "Turn off all lights"]
            
            answer = st.radio("Select the correct light action:", options, key=f"test_q_{st.session_state.test_question}")
            
            submit_key = f"submit_{st.session_state.test_question}"
            if st.button("Submit Answer", key=submit_key):
                if answer.lower() in lesson['english'].lower():
                    st.success("✅ Correct!")
                    st.session_state.score += 1
                else:
                    st.error(f"❌ Incorrect. The correct answer is: {lesson['english']}")
                
                st.session_state.test_question += 1
                # Force immediate rerun to go to next question
                st.rerun()
        
        else:
            # Test completed
            st.balloons()
            st.markdown("### 🎉 Test Completed!")
            score_percentage = (st.session_state.score / len(lessons)) * 100
            st.markdown(f"**Your Score: {st.session_state.score}/{len(lessons)} ({score_percentage:.1f}%)**")
            
            if score_percentage >= 80:
                st.success("Excellent! You're ready for the driving test! 🚗✨")
            elif score_percentage >= 60:
                st.warning("Good job! Keep practicing to improve your score. 📚")
            else:
                st.error("Keep studying! Practice more to master these commands. 💪")
            
            if st.button("Restart Test"):
                st.session_state.test_question = 0
                st.session_state.score = 0
                # Create new randomized question order
                st.session_state.question_order = list(range(len(lessons)))
                random.shuffle(st.session_state.question_order)
                st.rerun()
    
    # Progress tracking
    st.sidebar.markdown("### Test Info")
    st.sidebar.markdown(f"Total commands: {len(lessons)}")
    if test_mode == "Study Mode":
        st.sidebar.markdown(f"Current command: {st.session_state.selected_index + 1}")
        progress = (st.session_state.selected_index + 1) / len(lessons)
        st.sidebar.progress(progress)
    elif test_mode == "Test Mode":
        st.sidebar.markdown(f"Test progress: {st.session_state.get('test_question', 0) + 1}/{len(lessons)}")
        st.sidebar.markdown(f"Current score: {st.session_state.get('score', 0)}")
    
    # Quick reference
    st.sidebar.markdown("### Quick Reference")
    st.sidebar.markdown("**Light Types:**")
    light_types = [
        "近光灯 - Low beam",
        "远光灯 - High beam", 
        "示廓灯 - Width lights",
        "危险报警闪光灯 - Hazard lights",
        "转向指示灯 - Turn signals"
    ]
    for light in light_types:
        st.sidebar.markdown(f"- {light}")
    

if __name__ == "__main__":
    main()