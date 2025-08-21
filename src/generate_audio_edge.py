#!/usr/bin/env python3
"""
Chinese Learning Audio Generator - Edge TTS Version (FREE!)

Uses Microsoft Edge Text-to-Speech with native Chinese voices.
Completely free with excellent Chinese pronunciation.

Setup:
    pip install edge-tts
    python src/generate_audio_edge.py
"""

import asyncio
import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False
    print("❌ Edge TTS not available. Install with: pip install edge-tts")


class ChineseLearningParserEdge:
    def __init__(self, input_file: str = "input/HSK2.md"):
        self.input_file = input_file
        self.output_dir = Path("data")
        self.audio_dir = Path("audio")
        
        # Create directories if they don't exist
        self.output_dir.mkdir(exist_ok=True)
        self.audio_dir.mkdir(exist_ok=True)
        
        # Chinese voice options (all free!)
        self.voice_options = {
            'xiaoxiao': 'zh-CN-XiaoxiaoNeural',  # Female, sweet
            'yunyang': 'zh-CN-YunyangNeural',    # Male, warm
            'xiaohan': 'zh-CN-XiaohanNeural',    # Female, gentle
            'xiaomo': 'zh-CN-XiaomoNeural',      # Female, bright
            'yunxi': 'zh-CN-YunxiNeural',        # Male, young
            'xiaoxuan': 'zh-CN-XiaoxuanNeural'   # Female, professional
        }
        
        # French voice options (all free!)
        self.french_voice_options = {
            'denise': 'fr-FR-DeniseNeural',      # Female, clear
            'henri': 'fr-FR-HenriNeural',        # Male, warm
            'josephine': 'fr-FR-JosephineNeural', # Female, friendly
            'maurice': 'fr-FR-MauriceNeural',    # Male, professional
            'alain': 'fr-FR-AlainNeural',        # Male, mature
            'brigitte': 'fr-FR-BrigitteNeural'   # Female, warm
        }
        
        self.selected_voice = self.voice_options['yunyang']  
        self.selected_french_voice = self.french_voice_options['henri']  
        
        if not EDGE_TTS_AVAILABLE:
            print("❌ Edge TTS not available")
    
    def parse_markdown(self) -> List[Dict[str, Any]]:
        """Parse the markdown file and extract Chinese learning content."""
        if not Path(self.input_file).exists():
            raise FileNotFoundError(f"Input file {self.input_file} not found")
        
        with open(self.input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lessons = []
        
        # Pattern to match each lesson entry (supports both numeric and text IDs) with optional French
        pattern = r'## ([^.]+)\. (.+?)\n\*\*Pinyin:\*\* (.+?)\n\*\*Literal:\*\* (.+?)\n\*\*English:\*\* (.+?)(?:\n\*\*French:\*\* (.+?))?(?=\n\n|\n##|\Z)'
        
        matches = re.findall(pattern, content, re.DOTALL)
        
        for match in matches:
            # Handle the new pattern with optional French translation
            if len(match) == 6:  # With French translation
                lesson_id, chinese, pinyin, literal, english, french = match
            else:  # Without French translation
                lesson_id, chinese, pinyin, literal, english = match
                french = None
            
            # Extract clean source file name
            source_name = Path(self.input_file).stem
            
            # Handle both numeric and text lesson IDs
            if lesson_id.isdigit():
                # For driving lessons, use driving-X.mp3 format
                if source_name == "chinese-driving":
                    audio_filename = f"driving-{lesson_id}.mp3"
                    french_audio_filename = f"driving-{lesson_id}_fr.mp3"
                else:
                    audio_filename = f"lesson_{lesson_id.zfill(2)}.mp3"
                    french_audio_filename = f"lesson_{lesson_id.zfill(2)}_fr.mp3"
                display_id = int(lesson_id)
            else:
                # For text IDs like "6a", "8a", use driving format for driving lessons
                if source_name == "chinese-driving":
                    audio_filename = f"driving-{lesson_id}.mp3"
                    french_audio_filename = f"driving-{lesson_id}_fr.mp3"
                else:
                    audio_filename = f"{lesson_id}.mp3"
                    french_audio_filename = f"{lesson_id}_fr.mp3"
                display_id = lesson_id
            
            lesson_data = {
                'id': display_id,
                'chinese': chinese.strip(),
                'pinyin': pinyin.strip(),
                'literal': literal.strip(),
                'english': english.strip(),
                'audio_file': audio_filename,
                'source': source_name
            }
            
            # Add French if available
            if french and french.strip():
                lesson_data['french'] = french.strip()
                lesson_data['french_audio_file'] = french_audio_filename
            
            lessons.append(lesson_data)
        
        print(f"✅ Parsed {len(lessons)} lessons from {self.input_file}")
        return lessons
    
    async def generate_audio(self, text: str, output_file: str, language: str = 'chinese') -> bool:
        """Generate audio file for text using Edge TTS."""
        if not EDGE_TTS_AVAILABLE:
            print(f"❌ Cannot generate audio for '{text}' - Edge TTS not available")
            return False
        
        try:
            # Select voice based on language
            if language == 'french':
                voice = self.selected_french_voice
                rate = "-10%"  # Slightly slower for French
            else:  # Chinese
                # Use female voice for driving lessons, male voice for others
                if output_file.startswith('driving-'):
                    voice = self.voice_options['xiaoxuan']  # Female, professional
                else:
                    voice = self.selected_voice
                rate = "-20%"  # Optimal speed for Chinese learning
            
            # Create TTS communication
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                pitch="+0Hz"  # Normal pitch
            )
            
            # Save audio file
            audio_path = self.audio_dir / output_file
            await communicate.save(str(audio_path))
            
            print(f"✅ Generated {language} audio: {output_file}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to generate {language} audio for '{text}': {e}")
            return False
    
    async def process_all_lessons(self) -> Dict[str, Any]:
        """Parse lessons and generate audio files for all Chinese and French text."""
        lessons = self.parse_markdown()
        
        successful_chinese_audio = 0
        successful_french_audio = 0
        total_lessons = len(lessons)
        total_characters = sum(len(lesson['chinese']) for lesson in lessons)
        lessons_with_french = sum(1 for lesson in lessons if 'french' in lesson)
        
        print(f"\n🎵 Generating audio for {total_lessons} lessons using Edge TTS...")
        print(f"Chinese Voice: {self.selected_voice}")
        if lessons_with_french > 0:
            print(f"French Voice: {self.selected_french_voice}")
            print(f"Lessons with French: {lessons_with_french}")
        print(f"Total Chinese characters: {total_characters}")
        
        # Generate audio for each lesson
        for i, lesson in enumerate(lessons, 1):
            print(f"Processing lesson {i}/{total_lessons}: {lesson['chinese'][:30]}...")
            
            # Generate Chinese audio
            if await self.generate_audio(lesson['chinese'], lesson['audio_file'], 'chinese'):
                successful_chinese_audio += 1
            
            # Generate French audio if available
            if 'french' in lesson and lesson['french']:
                if await self.generate_audio(lesson['french'], lesson['french_audio_file'], 'french'):
                    successful_french_audio += 1
        
        # Create summary data
        summary = {
            'total_lessons': total_lessons,
            'audio_generated': successful_chinese_audio,
            'french_audio_generated': successful_french_audio,
            'total_characters': total_characters,
            'lessons_with_french': lessons_with_french,
            'estimated_cost_usd': 0.0,  # Edge TTS is free!
            'lessons': lessons,
            'metadata': {
                'source_file': self.input_file,
                'audio_directory': str(self.audio_dir),
                'tts_provider': 'edge',
                'voice_settings': {
                    'chinese_voice': self.selected_voice,
                    'french_voice': self.selected_french_voice,
                    'chinese_rate': '-20%',
                    'french_rate': '-10%',
                    'pitch': '+0Hz'
                }
            }
        }
        
        # Save lessons data as JSON for frontend
        output_file = self.output_dir / "lessons.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Saved lesson data to {output_file}")
        return summary


async def main():
    """Main execution function."""
    import sys
    
    print("🚀 Starting Chinese Learning Audio Generator (Edge TTS - FREE!)")
    print("=" * 65)
    
    if not EDGE_TTS_AVAILABLE:
        print("\n⚠️  Setup Required:")
        print("1. Install Edge TTS: pip install edge-tts")
        print("2. Re-run this script")
        print("\nContinuing with parsing only...")
    
    try:
        # Use command line argument if provided, otherwise default
        input_file = sys.argv[1] if len(sys.argv) > 1 else "input/HSK2.md"
        parser = ChineseLearningParserEdge(input_file)
        summary = await parser.process_all_lessons()
        
        print("\n" + "=" * 65)
        print("📊 Processing Summary:")
        print(f"   Total lessons: {summary['total_lessons']}")
        print(f"   Audio files generated: {summary['audio_generated']}")
        print(f"   Total characters: {summary['total_characters']:,}")
        print(f"   Cost: FREE! 🎉")
        
        if summary['audio_generated'] == 0:
            print("\n💡 To generate audio files:")
            print("   1. Install Edge TTS: pip install edge-tts")
            print("   2. Re-run this script")
        else:
            print(f"\n🎉 Successfully generated {summary['audio_generated']} audio files!")
            print("🔊 Using native Chinese voice for authentic pronunciation!")
        
        print(f"\n✅ Data saved to: data/lessons.json")
        print("🎯 Ready for frontend integration!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(asyncio.run(main()))