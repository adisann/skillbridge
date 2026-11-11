from worker.pipeline.extract import extract_job_details_rule_based
from worker.pipeline.normalize import normalize_skills_list


def test_jt_requires_hsk_5_without_explicit_word_mandarin_in_description():
    result = extract_job_details_rule_based("Data Analyst (Mandarin Speaker) - Pluit", "Job Requirements:\nBachelor's degree in any major\nMinimum HSK Level 5 proficiency.\nAt least 1 year of relevant working experience.\nProficient in using Excel (advanced functions preferred).\nStrong data analysis and data structuring capabilities.")
    assert "Mandarin (HSK 5)" in result.required_skills
    assert "Mandarin (HSK 5)" not in result.preferred_skills
    assert "Mandarin" not in result.required_skills
    assert result.experience_years_min == 1


def test_preferred_language_keeps_its_type():
    result = extract_job_details_rule_based("Data Analyst", "Requirements:\nSQL\nMandarin HSK 5 preferred.")
    assert "Mandarin (HSK 5)" in result.preferred_skills
    assert "Mandarin (HSK 5)" not in result.required_skills


def test_title_language_does_not_invent_certificate_level():
    result = extract_job_details_rule_based("Mandarin Speaker Analyst", "Analyze data with SQL.")
    assert "Mandarin" in result.required_skills
    assert not any("HSK" in s for s in result.required_skills)


def test_language_normalization_preserves_levels_without_double_counting_generic_name():
    assert normalize_skills_list(["Bahasa Mandarin", "HSK Level 5", "Mandarin (HSK 5)"]) == ["Mandarin (HSK 5)"]
    assert normalize_skills_list(["Mandarin", "SQL"]) == ["Mandarin", "SQL"]


def test_japanese_proficiency_keeps_minimum_and_preferred_level_separate():
    result = extract_job_details_rule_based("Japanese Speaker Analyst", "Requirements:\nMinimum JLPT N1 proficiency.\nSQL required.")
    assert "Jepang (JLPT N1)" in result.required_skills
    assert "Jepang" not in result.required_skills
    optional = extract_job_details_rule_based("Analyst", "Japanese JLPT N2 preferred.")
    assert "Jepang (JLPT N2)" in optional.preferred_skills
    assert "Jepang (JLPT N2)" not in optional.required_skills
    assert normalize_skills_list(["Bahasa Jepang", "JLPT N5", "Japanese N5"]) == ["Jepang (JLPT N5)"]
