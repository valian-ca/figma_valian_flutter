import 'package:flutter/material.dart';

// ignore: avoid_classes_with_only_static_members
abstract class AppTextStyles {
  static const TextStyle materialThemeDisplayLarge = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 57,
    fontWeight: .w400,
    height: 1.1228,
    letterSpacing: -0.25,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeDisplayMedium = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 45,
    fontWeight: .w400,
    height: 1.1556,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeDisplaySmall = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 19,
    fontWeight: .w600,
    height: 1.1579,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeHeadlineLarge = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 32,
    fontWeight: .w700,
    height: 1.25,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeHeadlineMedium = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 28,
    fontWeight: .w600,
    height: 1.2857,
    letterSpacing: 1,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeHeadlineSmall = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 24,
    fontWeight: .w600,
    height: 1.3333,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeTitleLarge = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 22,
    fontWeight: .w300,
    height: 1.2727,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeTitleMedium = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 16,
    fontWeight: .w400,
    height: 1.375,
    letterSpacing: 0.15,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeTitleSmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: .w500,
    height: 1.4286,
    letterSpacing: 0.1,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeLabelLarge = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 14,
    fontWeight: .w500,
    height: 1.4286,
    letterSpacing: 0.1,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeLabelMedium = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 12,
    fontWeight: .w500,
    height: 1.3333,
    letterSpacing: 0.5,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeLabelSmall = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 11,
    fontWeight: .w500,
    height: 1.4545,
    letterSpacing: 0.5,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeBodyLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: .w400,
    height: 1.5,
    letterSpacing: 0.5,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeBodyMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: .w400,
    height: 1.4286,
    letterSpacing: 0.25,
    fontStyle: .normal,
    decoration: .none,
  );

  static const TextStyle materialThemeBodySmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: .w400,
    height: 1.3333,
    letterSpacing: 0.2,
    fontStyle: .normal,
    decoration: .none,
  );
}

const textTheme = TextTheme(
  displayLarge: AppTextStyles.materialThemeDisplayLarge,
  displayMedium: AppTextStyles.materialThemeDisplayMedium,
  displaySmall: AppTextStyles.materialThemeDisplaySmall,
  headlineLarge: AppTextStyles.materialThemeHeadlineLarge,
  headlineMedium: AppTextStyles.materialThemeHeadlineMedium,
  headlineSmall: AppTextStyles.materialThemeHeadlineSmall,
  titleLarge: AppTextStyles.materialThemeTitleLarge,
  titleMedium: AppTextStyles.materialThemeTitleMedium,
  titleSmall: AppTextStyles.materialThemeTitleSmall,
  bodyLarge: AppTextStyles.materialThemeBodyLarge,
  bodyMedium: AppTextStyles.materialThemeBodyMedium,
  bodySmall: AppTextStyles.materialThemeBodySmall,
  labelLarge: AppTextStyles.materialThemeLabelLarge,
  labelMedium: AppTextStyles.materialThemeLabelMedium,
  labelSmall: AppTextStyles.materialThemeLabelSmall,
);
